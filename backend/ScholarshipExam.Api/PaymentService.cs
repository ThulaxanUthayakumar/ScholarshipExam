using Microsoft.EntityFrameworkCore;
using ScholarshipExam.Core;
using ScholarshipExam.Infrastructure;
namespace ScholarshipExam.Api;
public interface IPaymentVerifier { void RequireBankVerification(ReviewDto dto); }
public sealed class ManualPaymentVerifier:IPaymentVerifier { public void RequireBankVerification(ReviewDto dto){Input.Check(dto.BankVerified,"Verify the actual bank/payment record, not a screenshot.");Input.Check(!string.IsNullOrWhiteSpace(dto.Note),"A verification note is required.");} }
public class PaymentService(AppDb db,WorkLock gate,ContentService content,IPaymentVerifier verifier) {
 public async Task<bool> CanView(string actor,string student)=>actor==student||await db.ParentChildren.AnyAsync(x=>x.ParentId==actor&&x.ChildId==student);
 public async Task<object> Create(PaymentDto dto,string actor){Input.Validate(dto);var student=dto.StudentId??actor;Input.Check(await CanView(actor,student),"Forbidden.",403);return await gate.Run("student:"+student,async()=>{
  var old=await db.Payments.SingleOrDefaultAsync(x=>x.PayerId==actor&&x.IdempotencyKey==dto.IdempotencyKey);if(old!=null){Input.Check(old.StudentId==student&&old.Reference==dto.Reference?.Trim().ToUpperInvariant(),"Idempotency key reused with different details.",409);return (object)old;}
  var settings=await db.Settings.SingleAsync();Input.Check(settings.AcceptPayments&&!string.IsNullOrWhiteSpace(settings.PaymentInstructions),"Payments are not open yet.",409);
  Input.Check(await db.Exams.CountAsync(x=>x.Status=="Published"&&x.TeacherReviewed)==5,"Five reviewed exams must be available before payment.",409);
  Input.Check(!await db.Payments.AnyAsync(x=>x.StudentId==student&&(x.Status=="Pending"||x.Status=="AwaitingReference")),"A payment is already awaiting review.",409);
  Input.Check(!await (from e in db.Entitlements join s in db.Subscriptions on e.SubscriptionId equals s.Id where s.StudentId==student&&!e.Used select e).AnyAsync(),"Use your remaining exams before buying another package.",409);
  var reference=dto.Reference?.Trim().ToUpperInvariant();if(reference!=null){Input.Check(reference.Length>=4,"Enter a valid transaction reference.");Input.Check(!await db.Payments.AnyAsync(x=>x.Reference==reference),"Reference already submitted. Contact support.",409);}
  var p=new Payment{StudentId=student,PayerId=actor,Reference=reference,Status=reference==null?"AwaitingReference":"Pending",IdempotencyKey=dto.IdempotencyKey};db.Payments.Add(p);content.Audit(actor,"payment.submit",p.Id.ToString());return (object)p;
 });}
 public async Task<object> SetReference(Guid id,ReferenceDto dto,string actor){Input.Validate(dto);return await gate.Run("payments",async()=>{
  var p=await db.Payments.SingleOrDefaultAsync(x=>x.Id==id&&x.PayerId==actor);Input.Check(p!=null,"Payment not found.",404);var reference=dto.Reference.Trim().ToUpperInvariant();Input.Check(reference.Length>=4,"Enter a valid reference.");if(p.Status=="Pending"&&p.Reference==reference)return (object)new{p.Id,p.Status};Input.Check(p.Status=="AwaitingReference","Reference cannot be changed after submission.",409);Input.Check(!await db.Payments.AnyAsync(x=>x.Reference==reference),"Reference already submitted.",409);p.Reference=reference;p.Status="Pending";content.Audit(actor,"payment.reference",id.ToString());return (object)new{p.Id,p.Status};
 });}
 public async Task<object> Review(Guid id,ReviewDto dto,bool approve,string actor){Input.Validate(dto);var student=await db.Payments.Where(x=>x.Id==id).Select(x=>x.StudentId).SingleOrDefaultAsync();Input.Check(student!=null,"Payment not found.",404);return await gate.Run("student:"+student,async()=>{
  var p=await db.Payments.SingleAsync(x=>x.Id==id);if(p.Status==(approve?"Approved":"Rejected"))return (object)new{p.Id,p.Status};Input.Check(p.Status=="Pending"||(!approve&&p.Status=="AwaitingReference"),"Payment has already been reviewed or needs a reference.",409);
  if(approve){verifier.RequireBankVerification(dto);var exams=await db.Exams.Where(x=>x.Status=="Published"&&x.TeacherReviewed).OrderBy(x=>x.ExternalKey).ToListAsync();Input.Check(exams.Count==5,"Publish exactly five reviewed exams before activation.",409);Input.Check(!await (from e in db.Entitlements join s in db.Subscriptions on e.SubscriptionId equals s.Id where s.StudentId==p.StudentId&&!e.Used select e).AnyAsync(),"Student already has unused entitlements.",409);var sub=new Subscription{StudentId=p.StudentId,PaymentId=p.Id};sub.Entitlements=exams.Select(e=>new Entitlement{SubscriptionId=sub.Id,ExamId=e.Id}).ToList();db.Subscriptions.Add(sub);}
  p.Status=approve?"Approved":"Rejected";p.ReviewNote=dto.Note;p.ReviewedAt=DateTime.UtcNow;p.ReviewedBy=actor;content.Audit(actor,"payment."+p.Status.ToLowerInvariant(),id.ToString(),dto.Note);return (object)new{p.Id,p.Status};
 });}
}

