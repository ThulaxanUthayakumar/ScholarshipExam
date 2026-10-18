using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ScholarshipExam.Infrastructure;
using ScholarshipExam.Core;
namespace ScholarshipExam.Api;
public static class Seeder {
 public static async Task Run(IServiceProvider services,IConfiguration config){
  var db=services.GetRequiredService<AppDb>();var roles=services.GetRequiredService<RoleManager<IdentityRole>>();var users=services.GetRequiredService<UserManager<ApplicationUser>>();
  foreach(var name in new[]{"Student","Parent","Administrator"})if(!await roles.RoleExistsAsync(name)){var result=await roles.CreateAsync(new IdentityRole(name));if(!result.Succeeded)throw new InvalidOperationException("Could not create role.");}
  if(!await db.Settings.AnyAsync())db.Settings.Add(new PlatformSettings());
  var definitions=new[]{("SCHOLARSHIP_STAR","புலமை நட்சத்திரம்",60),("EXCELLENT_ACHIEVER","சிறந்த சாதனையாளர்",80),("SCHOLARSHIP_CHAMPION","புலமைச் சாதனையாளர்",60)};
  foreach(var (code,title,threshold) in definitions)if(!await db.Rewards.AnyAsync(x=>x.Code==code))db.Rewards.Add(new Reward{Code=code,Title=title,Threshold=threshold});
  await db.SaveChangesAsync();
  if(!await db.Exams.AnyAsync()){var path=Path.Combine(AppContext.BaseDirectory,"data","model-exams.ta.json");if(File.Exists(path)){var dto=JsonSerializer.Deserialize<ImportDto>(await File.ReadAllTextAsync(path),new JsonSerializerOptions{PropertyNameCaseInsensitive=true})!;await services.GetRequiredService<ContentService>().Import(dto,"system:initial-seed");}}
  var email=config["Bootstrap:Email"];var password=config["Bootstrap:Password"];
  if(!string.IsNullOrWhiteSpace(email)&&!string.IsNullOrWhiteSpace(password)){
   var user=await users.FindByEmailAsync(email);
   if(user==null){user=new ApplicationUser{UserName=email,Email=email,DisplayName="Administrator",ConsentAt=DateTime.UtcNow};var result=await users.CreateAsync(user,password);if(!result.Succeeded)throw new InvalidOperationException(string.Join(" ",result.Errors.Select(x=>x.Description)));var added=await users.AddToRoleAsync(user,"Administrator");if(!added.Succeeded)throw new InvalidOperationException("Administrator role creation failed.");}
   else if(!await users.IsInRoleAsync(user,"Administrator"))throw new InvalidOperationException("Bootstrap email is already used by a non-admin account. Choose a different email.");
  }
 }
}
public class ExpiryWorker(IServiceScopeFactory factory,ILogger<ExpiryWorker> log):BackgroundService {
 protected override async Task ExecuteAsync(CancellationToken stoppingToken){using var timer=new PeriodicTimer(TimeSpan.FromSeconds(30));try{while(await timer.WaitForNextTickAsync(stoppingToken)){try{using var scope=factory.CreateScope();var db=scope.ServiceProvider.GetRequiredService<AppDb>();var pending=await db.Attempts.Where(x=>x.Status=="Active"&&x.ExpiresAt<=DateTime.UtcNow).Select(x=>new{x.Id,x.StudentId}).Take(100).ToListAsync(stoppingToken);foreach(var a in pending)await scope.ServiceProvider.GetRequiredService<ExamService>().Submit(a.Id,a.StudentId);}catch(Exception e){log.LogError(e,"Attempt expiry sweep failed.");}}}catch(OperationCanceledException)when(stoppingToken.IsCancellationRequested){}}
}

