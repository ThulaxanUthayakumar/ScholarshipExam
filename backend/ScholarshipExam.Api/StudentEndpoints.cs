using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using ScholarshipExam.Infrastructure;
namespace ScholarshipExam.Api;
public static class StudentEndpoints {
 public static void MapStudent(this WebApplication app){
  var student=app.MapGroup("/api").RequireAuthorization(p=>p.RequireRole("Student"));
  student.MapGet("/exams",async(AppDb db,ClaimsPrincipal u)=>await db.Exams.Where(x=>x.Status=="Published"||(x.TeacherReviewed&&x.Status!="Archived"&&db.Entitlements.Any(e=>e.ExamId==x.Id&&db.Subscriptions.Any(s=>s.Id==e.SubscriptionId&&s.StudentId==u.UserId())))).OrderBy(x=>x.ExternalKey).Select(x=>new{x.Id,x.Title,x.Description,x.DurationMinutes,x.PassPercentage,questionCount=x.Questions.Count}).ToListAsync());
  student.MapGet("/exams/{id:guid}",async(Guid id,AppDb db)=>{var e=await db.Exams.Where(x=>x.Id==id&&x.Status=="Published").Select(x=>new{x.Id,x.Title,x.Description,x.DurationMinutes,x.PassPercentage,questionCount=x.Questions.Count}).SingleOrDefaultAsync();return e==null?Results.NotFound():Results.Ok(e);});
  student.MapPost("/exams/{id:guid}/attempts",async(Guid id,ClaimsPrincipal u,ExamService exams)=>{var a=await exams.Start(id,u.UserId());return Results.Ok(new{a.Id,a.Status,a.ExpiresAt});});
  student.MapGet("/attempts/{id:guid}/questions",async(Guid id,ClaimsPrincipal u,ExamService exams)=>await exams.Questions(id,u.UserId()));
  student.MapPut("/attempts/{id:guid}/answers",async(Guid id,AnswerDto dto,ClaimsPrincipal u,ExamService exams)=>await exams.Save(id,u.UserId(),dto));
  student.MapPost("/attempts/{id:guid}/submit",async(Guid id,ClaimsPrincipal u,ExamService exams)=>await exams.Submit(id,u.UserId()));
  app.MapGet("/api/attempts/{id:guid}/result",async(Guid id,ClaimsPrincipal u,ExamService exams,AppDb db,PaymentService payments)=>{var owner=await db.Attempts.Where(x=>x.Id==id).Select(x=>x.StudentId).SingleOrDefaultAsync();Input.Check(owner!=null&&await payments.CanView(u.UserId(),owner),"Not found.",404);return await exams.Result(id,owner!);}).RequireAuthorization();
  app.MapGet("/api/dashboard",async(string? studentId,ClaimsPrincipal u,AppDb db,PaymentService payments,ExamService exams)=>{
   var id=studentId??u.UserId();Input.Check(await payments.CanView(u.UserId(),id),"Not found.",404);
   var expired=await db.Attempts.Where(x=>x.StudentId==id&&x.Status=="Active"&&x.ExpiresAt<=DateTime.UtcNow).Select(x=>x.Id).ToListAsync();foreach(var a in expired)await exams.Submit(a,id);
   var subs=await db.Subscriptions.AsNoTracking().Include(x=>x.Entitlements).Where(x=>x.StudentId==id).ToListAsync();
   var attempts=await (from a in db.Attempts join e in db.Exams on a.ExamId equals e.Id where a.StudentId==id orderby a.CreatedAt descending select new{a.Id,a.ExamId,e.Title,a.Status,a.Score,a.Percentage,a.Passed,a.CreatedAt,a.ExpiresAt}).ToListAsync();
   return Results.Ok(new{subscriptions=subs.Select(s=>new{s.Id,s.Status,s.CreatedAt,remaining=s.Entitlements.Count(e=>!e.Used),entitlements=s.Entitlements.Select(e=>new{e.ExamId,e.Used})}),attempts,rewards=await db.StudentRewards.Where(x=>x.StudentId==id).Select(x=>new{x.Code,x.CreatedAt,x.AttemptId}).ToListAsync()});
  }).RequireAuthorization();
  app.MapGet("/api/subscriptions/me",async(ClaimsPrincipal u,AppDb db)=>await db.Subscriptions.Where(x=>x.StudentId==u.UserId()).Select(x=>new{x.Id,x.Status,x.CreatedAt,remaining=x.Entitlements.Count(e=>!e.Used)}).ToListAsync()).RequireAuthorization();
  app.MapGet("/api/rewards/me",async(ClaimsPrincipal u,AppDb db)=>await db.StudentRewards.Where(x=>x.StudentId==u.UserId()).Select(x=>new{x.Code,x.AttemptId,x.CreatedAt}).ToListAsync()).RequireAuthorization();
  app.MapPost("/api/payments",async(PaymentDto dto,ClaimsPrincipal u,PaymentService payments,AppDb db)=>{var id=dto.StudentId??u.UserId();var isStudent=await (from ur in db.UserRoles join role in db.Roles on ur.RoleId equals role.Id where ur.UserId==id&&role.Name=="Student" select ur).AnyAsync();Input.Check(isStudent,"Select a student profile.");return await payments.Create(dto,u.UserId());}).RequireAuthorization();
  app.MapPut("/api/payments/{id:guid}/reference",async(Guid id,ReferenceDto dto,ClaimsPrincipal u,PaymentService p)=>await p.SetReference(id,dto,u.UserId())).RequireAuthorization();
  app.MapGet("/api/payments/me",async(ClaimsPrincipal u,AppDb db)=>await db.Payments.Where(x=>x.PayerId==u.UserId()||x.StudentId==u.UserId()||db.ParentChildren.Any(l=>l.ParentId==u.UserId()&&l.ChildId==x.StudentId)).OrderByDescending(x=>x.CreatedAt).Select(x=>new{x.Id,x.StudentId,x.Reference,x.Amount,x.Currency,x.Status,x.ReviewNote,x.CreatedAt}).ToListAsync()).RequireAuthorization();
 }
}

