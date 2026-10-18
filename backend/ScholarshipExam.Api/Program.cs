using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ScholarshipExam.Api;
using ScholarshipExam.Core;
using ScholarshipExam.Infrastructure;

var builder=WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(o=>o.Limits.MaxRequestBodySize=2_000_000);
builder.Services.AddProblemDetails();builder.Services.AddOpenApi();
var provider=builder.Configuration["Database:Provider"]??"PostgreSQL";
if(provider=="Sqlite"&&!builder.Environment.IsDevelopment()&&!builder.Environment.IsEnvironment("Testing"))throw new InvalidOperationException("SQLite is for local development/tests only. Configure PostgreSQL for production.");
builder.Services.AddDbContext<AppDb>(options=>{if(provider=="Sqlite")options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")??"Data Source=scholarship-local.db");else options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")??throw new InvalidOperationException("Set ConnectionStrings__DefaultConnection."),o=>o.MigrationsAssembly("ScholarshipExam.Api"));});
builder.Services.AddIdentityCore<ApplicationUser>(o=>{o.Password.RequiredLength=10;o.User.RequireUniqueEmail=true;o.Lockout.MaxFailedAccessAttempts=5;o.Lockout.DefaultLockoutTimeSpan=TimeSpan.FromMinutes(15);}).AddRoles<IdentityRole>().AddEntityFrameworkStores<AppDb>().AddSignInManager().AddDefaultTokenProviders();
builder.Services.AddAuthentication(IdentityConstants.BearerScheme).AddBearerToken(IdentityConstants.BearerScheme,o=>{o.BearerTokenExpiration=TimeSpan.FromHours(4);});builder.Services.AddAuthorization();
var keyPath=builder.Configuration["DataProtection:Path"]??Path.Combine(builder.Environment.ContentRootPath,".keys");Directory.CreateDirectory(keyPath);builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(keyPath)).SetApplicationName("ScholarshipExam");
var origins=builder.Configuration.GetSection("Frontend:Origins").Get<string[]>()??[];if(origins.Length==0)throw new InvalidOperationException("Configure Frontend:Origins.");
builder.Services.AddCors(o=>o.AddPolicy("Frontend",p=>p.WithOrigins(origins).WithMethods("GET","POST","PUT","DELETE").WithHeaders("Content-Type","Authorization")));
builder.Services.AddRateLimiter(o=>{o.RejectionStatusCode=429;foreach(var name in new[]{"public","auth"})o.AddPolicy(name,c=>RateLimitPartition.GetFixedWindowLimiter(c.Connection.RemoteIpAddress?.ToString()??"unknown",_=>new FixedWindowRateLimiterOptions{PermitLimit=name=="auth"?30:300,Window=TimeSpan.FromMinutes(1),QueueLimit=0}));});
builder.Services.AddSingleton(TimeProvider.System);builder.Services.AddScoped<WorkLock>();builder.Services.AddScoped<ExamService>();builder.Services.AddScoped<ContentService>();builder.Services.AddScoped<PaymentService>();builder.Services.AddScoped<IPaymentVerifier,ManualPaymentVerifier>();builder.Services.AddHostedService<ExpiryWorker>();
var app=builder.Build();
app.UseExceptionHandler();app.Use(async(ctx,next)=>{try{await next();}catch(ApiError e){await Results.Problem(e.Message,statusCode:e.Status).ExecuteAsync(ctx);}catch(DbUpdateException e){app.Logger.LogError(e,"Database write conflict.");await Results.Problem("This change conflicts with another operation. Refresh and try again.",statusCode:409).ExecuteAsync(ctx);}});
app.UseStatusCodePages();if(!app.Environment.IsDevelopment()&&!app.Environment.IsEnvironment("Testing")){app.UseHsts();app.UseHttpsRedirection();}
app.Use(async(ctx,next)=>{ctx.Response.Headers["X-Content-Type-Options"]="nosniff";ctx.Response.Headers["Referrer-Policy"]="strict-origin-when-cross-origin";ctx.Response.Headers["Cache-Control"]="no-store";await next();});
app.UseCors("Frontend");app.UseRateLimiter();app.UseAuthentication();
app.Use(async(ctx,next)=>{if(ctx.User.Identity?.IsAuthenticated==true){var users=ctx.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();var user=await users.FindByIdAsync(ctx.User.UserId());if(user==null||user.Disabled||ctx.User.FindFirstValue("AspNet.Identity.SecurityStamp")!=await users.GetSecurityStampAsync(user)){ctx.Response.StatusCode=401;return;}}await next();});app.UseAuthorization();
app.MapGet("/api/health",()=>Results.Ok(new{status="ok",service="scholarship-api"}));
app.MapGet("/api/public/package",async(AppDb db)=>{var settings=await db.Settings.SingleOrDefaultAsync();var enabled=settings?.AcceptPayments==true&&await db.Exams.CountAsync(e=>e.Status=="Published"&&e.TeacherReviewed)==5;return Results.Ok(PilotPackage.Initial with{PurchasesEnabled=enabled});}).RequireRateLimiting("public");
app.MapGet("/api/public/settings",async(AppDb db)=>{var s=await db.Settings.SingleAsync();return new{s.PaymentInstructions,s.ContactEmail,s.AcceptPayments};}).RequireRateLimiting("public");
// Separate original free-demo content. Paid answer keys are never used in these anonymous endpoints.
app.MapGet("/api/public/demo",()=>new{question="ஒரு பெட்டியில் 6 பென்சில்கள் உள்ளன. 3 பெட்டிகளில் எத்தனை பென்சில்கள் இருக்கும்?",options=new[]{"12","18","9","24"}});
app.MapPost("/api/public/demo",(Dictionary<string,int> answer)=>new{correct=answer.GetValueOrDefault("option",-1)==1,answer="18",explanation="ஒரு பெட்டியில் 6. எனவே 3 × 6 = 18 பென்சில்கள்."}).RequireRateLimiting("public");
app.MapAuth();app.MapStudent();app.MapAdmin();if(app.Environment.IsDevelopment())app.MapOpenApi();
if(!app.Environment.IsEnvironment("Testing")){
 using var scope=app.Services.CreateScope();var db=scope.ServiceProvider.GetRequiredService<AppDb>();
 if(provider=="Sqlite"){await db.Database.EnsureCreatedAsync();await Seeder.Run(scope.ServiceProvider,builder.Configuration);}
 else if(args.Contains("--migrate")){await db.Database.MigrateAsync();await Seeder.Run(scope.ServiceProvider,builder.Configuration);}
 if(args.Contains("--migrate"))return;
}
app.Run();
public partial class Program { }

