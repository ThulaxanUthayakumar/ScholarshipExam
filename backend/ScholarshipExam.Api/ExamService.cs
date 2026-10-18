using Microsoft.EntityFrameworkCore;
using ScholarshipExam.Core;
using ScholarshipExam.Infrastructure;
namespace ScholarshipExam.Api;
public class ExamService(AppDb db, WorkLock gate, TimeProvider clock) {
 public DateTime Now=>clock.GetUtcNow().UtcDateTime;
 public async Task<ExamAttempt> Start(Guid examId,string userId)=>await gate.Run("student:"+userId,async()=>{
  var active=await db.Attempts.FirstOrDefaultAsync(x=>x.StudentId==userId&&x.ExamId==examId&&x.Status=="Active");
  if(active!=null){await FinalizeIfExpired(active);return active;}
  var entitlement=await (from e in db.Entitlements join s in db.Subscriptions on e.SubscriptionId equals s.Id where s.StudentId==userId&&s.Status=="Active"&&e.ExamId==examId&&!e.Used select e).FirstOrDefaultAsync();
  Input.Check(entitlement!=null,"இந்தத் தேர்வுக்கான அனுமதி இல்லை.",403);
  var exam=await db.Exams.FindAsync(examId);Input.Check(exam!=null&&exam.TeacherReviewed&&exam.Status!="Archived","தேர்வு கிடைக்கவில்லை.",404);
  entitlement!.Used=true;var attempt=new ExamAttempt{StudentId=userId,ExamId=examId,EntitlementId=entitlement.Id,SubscriptionId=entitlement.SubscriptionId,CreatedAt=Now,ExpiresAt=Now.AddMinutes(exam!.DurationMinutes)};db.Attempts.Add(attempt);return attempt;
 });
 public async Task<ExamAttempt> Owned(Guid id,string userId) {var a=await db.Attempts.Include(x=>x.Answers).FirstOrDefaultAsync(x=>x.Id==id&&x.StudentId==userId);Input.Check(a!=null,"முயற்சி கிடைக்கவில்லை.",404);return a!;}
 public async Task<object> Questions(Guid id,string userId)=>await gate.Run("student:"+userId,async()=>{
  var a=await Owned(id,userId);await FinalizeIfExpired(a);
  var exam=await db.Exams.Include(x=>x.Questions).ThenInclude(x=>x.Options).SingleAsync(x=>x.Id==a.ExamId);
  return (object)new{a.Id,a.Status,a.ExpiresAt,serverNow=Now,exam.Title,questions=exam.Questions.OrderBy(x=>x.DisplayOrder).Select(q=>new{q.Id,q.QuestionText,q.Marks,q.DisplayOrder,q.DiagramKey,q.DiagramAlt,options=q.Options.OrderBy(o=>o.Key).Select(o=>new{o.Id,o.Key,o.Text})}),answers=a.Answers.Select(x=>new{x.QuestionId,x.OptionId})};
 });
 public async Task<object> Save(Guid id,string userId,AnswerDto answer)=>await gate.Run("student:"+userId,async()=>{
  var a=await Owned(id,userId);await FinalizeIfExpired(a);
  if(a.Status!="Active")return (object)new{a.Status,saved=false};
  Input.Check(await db.Questions.AnyAsync(q=>q.Id==answer.QuestionId&&q.ExamId==a.ExamId)&&await db.Options.AnyAsync(o=>o.Id==answer.OptionId&&o.QuestionId==answer.QuestionId),"விடை செல்லுபடியாகவில்லை.");
  var current=a.Answers.FirstOrDefault(x=>x.QuestionId==answer.QuestionId);
  if(current==null)db.Answers.Add(new StudentAnswer{AttemptId=a.Id,QuestionId=answer.QuestionId,OptionId=answer.OptionId});else current.OptionId=answer.OptionId;
  return (object)new{a.Status,saved=true};
 });
 public async Task<object> Submit(Guid id,string userId)=>await gate.Run("student:"+userId,async()=>{var a=await Owned(id,userId);if(a.Status=="Active")await Finalize(a,a.ExpiresAt<=Now);return (object)new{a.Id,a.Status,a.Score,a.Percentage,a.Passed};});
 public async Task FinalizeIfExpired(ExamAttempt a){if(a.Status=="Active"&&a.ExpiresAt<=Now)await Finalize(a,true);}
 private async Task Finalize(ExamAttempt a,bool expired){
  await db.Entry(a).Collection(x=>x.Answers).LoadAsync();var exam=await db.Exams.Include(x=>x.Questions).ThenInclude(x=>x.Options).SingleAsync(x=>x.Id==a.ExamId);
  a.Score=exam.Questions.Where(q=>a.Answers.Any(ans=>ans.QuestionId==q.Id&&q.Options.Any(o=>o.Id==ans.OptionId&&o.IsCorrect))).Sum(q=>q.Marks);
  a.Percentage=Scoring.Percentage(a.Score,exam.Questions.Sum(q=>q.Marks));a.Passed=a.Percentage>=exam.PassPercentage;a.Status=expired?"Expired":"Submitted";a.SubmittedAt=Now;
  var rules=await db.Rewards.Where(x=>x.Enabled).ToListAsync();
  foreach(var rule in rules.Where(x=>x.Code!="SCHOLARSHIP_CHAMPION"&&a.Percentage>=x.Threshold))await Award(a,rule.Code,a.Id.ToString());
  // Flush the finalized result inside the same transaction before checking the distinct-exam set.
  await db.SaveChangesAsync();var champion=rules.SingleOrDefault(x=>x.Code=="SCHOLARSHIP_CHAMPION");
  if(champion!=null){var required=await db.Entitlements.Where(x=>x.SubscriptionId==a.SubscriptionId).Select(x=>x.ExamId).ToListAsync();var results=await db.Attempts.Where(x=>x.SubscriptionId==a.SubscriptionId&&x.Status!="Active"&&x.Percentage>=champion.Threshold).Select(x=>x.ExamId).Distinct().ToListAsync();if(required.Distinct().Count()==5&&required.All(results.Contains))await Award(a,champion.Code,a.SubscriptionId.ToString());}
 }
 private async Task Award(ExamAttempt a,string code,string scope){var key=scope+":"+code;if(!await db.StudentRewards.AnyAsync(x=>x.AwardKey==key))db.StudentRewards.Add(new StudentReward{StudentId=a.StudentId,AttemptId=a.Id,SubscriptionId=a.SubscriptionId,Code=code,AwardKey=key});}
 public async Task<object> Result(Guid id,string userId,bool admin=false)=>await gate.Run("student:"+userId,async()=>{
  var a=admin?await db.Attempts.Include(x=>x.Answers).SingleOrDefaultAsync(x=>x.Id==id):await Owned(id,userId);Input.Check(a!=null,"முடிவு கிடைக்கவில்லை.",404);await FinalizeIfExpired(a!);Input.Check(a!.Status!="Active","முதலில் தேர்வைச் சமர்ப்பிக்கவும்.",409);
  var exam=await db.Exams.Include(x=>x.Questions).ThenInclude(x=>x.Options).SingleAsync(x=>x.Id==a.ExamId);
  return (object)new{a.Id,exam.Title,a.Status,a.Score,a.Percentage,a.Passed,a.SubmittedAt,total=exam.Questions.Sum(x=>x.Marks),message=a.Passed?"நன்றாக முயற்சி செய்துள்ளீர்கள்! தொடர்ந்து கற்போம்.":"ஒவ்வொரு முயற்சியும் முன்னேற்றமே. விளக்கங்களைப் படித்து மீண்டும் பயிற்சி செய்வோம்.",rewards=await db.StudentRewards.Where(x=>x.AttemptId==a.Id).Select(x=>x.Code).ToListAsync(),questions=exam.Questions.OrderBy(x=>x.DisplayOrder).Select(q=>new{q.Id,q.QuestionText,q.Explanation,q.Marks,q.DiagramKey,q.DiagramAlt,selectedOptionId=a.Answers.FirstOrDefault(x=>x.QuestionId==q.Id)?.OptionId,options=q.Options.OrderBy(x=>x.Key).Select(o=>new{o.Id,o.Key,o.Text,o.IsCorrect})})};
 });
}

