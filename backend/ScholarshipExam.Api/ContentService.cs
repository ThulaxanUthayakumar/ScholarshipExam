using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ScholarshipExam.Core;
using ScholarshipExam.Infrastructure;
namespace ScholarshipExam.Api;
public class ContentService(AppDb db,WorkLock gate) {
 public static void ValidateQuestion(QuestionDto q){
  Input.Check(q!=null,"Question record cannot be null.");
  Input.Check(!string.IsNullOrWhiteSpace(q.QuestionText)&&q.QuestionText.Length<=4000,"Question text is required (maximum 4000 characters).");
  Input.Check(!string.IsNullOrWhiteSpace(q.Explanation)&&q.Explanation.Length<=6000,"Explanation is required.");Input.Check(!string.IsNullOrWhiteSpace(q.Topic)&&q.Topic.Length<=100,"Topic is required.");
  Input.Check(q.Marks==2.5m&&q.DisplayOrder is >=1 and <=40,"Each question needs 2.5 marks and displayOrder 1–40.");
  Input.Check(q.Options!=null&&q.Options.Count is 3 or 4,"Three or four options are required.");
  Input.Check(q.Options!.All(x=>x!=null&&new[]{"A","B","C","D"}.Contains(x.Key)&&!string.IsNullOrWhiteSpace(x.Text)&&x.Text.Length<=2000)&&q.Options.Select(x=>x.Key).Distinct().Count()==q.Options.Count&&q.Options.Select(x=>x.Text.Trim()).Distinct().Count()==q.Options.Count,"Options must have distinct A/B/C/D keys and distinct nonempty text.");
  Input.Check(q.DiagramKey==null||(System.Text.RegularExpressions.Regex.IsMatch(q.DiagramKey,@"^paper-[1-5]-q-(26|27|28)$")&&!string.IsNullOrWhiteSpace(q.DiagramAlt)&&q.DiagramAlt.Length<=1000),"Invalid diagram key or missing accessible diagram description.");
  Input.Check(q.Options.Count(x=>x.Key==q.CorrectOptionKey)==1,"Correct option key must match one option.");
 }
 public static void ValidateImport(ImportDto dto){
  Input.Check(dto.SchemaVersion==1&&dto.Language=="ta"&&dto.Medium=="Tamil","Expected schemaVersion 1, language ta, medium Tamil.");Input.Check(dto.Exams!=null&&dto.Exams.Count is >=1 and <=5,"Import one to five exams.");
  Input.Check(dto.Exams!.All(x=>x!=null&&!string.IsNullOrWhiteSpace(x.Key)&&x.Key.Length<=80)&&dto.Exams.Select(x=>x.Key).Distinct().Count()==dto.Exams.Count,"Exam keys must be unique and nonempty.");
  foreach(var e in dto.Exams){Input.Check(!string.IsNullOrWhiteSpace(e.Title)&&e.Title.Length<=200&&e.Description!=null&&e.Description.Length<=1500&&e.DurationMinutes is >=5 and <=120,"Invalid exam title, description or duration.");Input.Check(e.Questions!=null&&e.Questions.Count==40,$"{e.Key}: Exactly 40 questions are required.");foreach(var q in e.Questions!)ValidateQuestion(q);Input.Check(e.Questions.Sum(x=>x.Marks)==100&&e.Questions.Select(x=>x.DisplayOrder).Distinct().Count()==40&&e.Questions.Select(x=>x.QuestionText.Trim()).Distinct().Count()==40,$"{e.Key}: Duplicate question/order or total marks not 100.");}
 }
 public static Question Map(Guid examId,QuestionDto q)=>new(){ExamId=examId,QuestionText=q.QuestionText.Trim(),Explanation=q.Explanation.Trim(),Topic=q.Topic.Trim(),Marks=q.Marks,DisplayOrder=q.DisplayOrder,DiagramKey=q.DiagramKey,DiagramAlt=q.DiagramAlt,Options=q.Options.Select(o=>new QuestionOption{Key=o.Key,Text=o.Text.Trim(),IsCorrect=o.Key==q.CorrectOptionKey}).ToList()};
 public void Audit(string actor,string action,string target,string note="")=>db.Audit.Add(new AuditRecord{ActorId=actor,Action=action,Target=target,Note=note});
 public async Task Editable(Guid id){Input.Check(!await db.Entitlements.AnyAsync(x=>x.ExamId==id),"Paid or attempted exams are immutable. Create a new exam with a new key.",409);}
 public async Task<object> Import(ImportDto dto,string actor){ValidateImport(dto);return await gate.Run("catalog",async()=>{
  var imported=0;var unchanged=0;
  foreach(var item in dto.Exams){var hash=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(item))));var e=await db.Exams.Include(x=>x.Questions).ThenInclude(x=>x.Options).SingleOrDefaultAsync(x=>x.ExternalKey==item.Key);
   if(e?.ImportHash==hash){unchanged++;continue;}if(e==null){e=new Exam{ExternalKey=item.Key};db.Exams.Add(e);}else {await Editable(e.Id);db.Questions.RemoveRange(e.Questions);await db.SaveChangesAsync();e.Questions.Clear();}
   e.Title=item.Title;e.Description=item.Description;e.DurationMinutes=item.DurationMinutes;e.Status="Draft";e.TeacherReviewed=false;e.ImportHash=hash;e.UpdatedAt=DateTime.UtcNow;e.Questions=item.Questions.Select(q=>Map(e.Id,q)).ToList();imported++;
  }Audit(actor,"content.import","catalog",$"Imported: {imported}; unchanged: {unchanged}");return (object)new{imported,unchanged};
 });}
 public async Task<object> Publish(Guid id,bool confirmed,string actor)=>await gate.Run("catalog",async()=>{
  var e=await db.Exams.Include(x=>x.Questions).ThenInclude(x=>x.Options).SingleOrDefaultAsync(x=>x.Id==id);Input.Check(e!=null,"Exam not found.",404);Input.Check(confirmed,"Confirm teacher review of accuracy, Tamil, difficulty and curriculum alignment.");
  ValidateImport(new ImportDto(1,"ta","Tamil",[new ImportExamDto(e!.ExternalKey,e.Title,e.Description,e.DurationMinutes,e.Questions.Select(q=>new QuestionDto(q.QuestionText,q.Options.Select(o=>new OptionDto(o.Key,o.Text)).ToList(),q.Options.Single(o=>o.IsCorrect).Key,q.Explanation,q.Marks,q.Topic,q.DisplayOrder,q.DiagramKey,q.DiagramAlt)).ToList())]));
  e.TeacherReviewed=true;e.Status="Published";e.UpdatedAt=DateTime.UtcNow;Audit(actor,"exam.publish",id.ToString(),"Teacher review confirmed");return (object)new{e.Id,e.Status};
 });
}

