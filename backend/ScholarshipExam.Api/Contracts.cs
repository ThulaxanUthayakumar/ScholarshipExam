using System.ComponentModel.DataAnnotations;
namespace ScholarshipExam.Api;
public record RegisterDto([Required,EmailAddress] string Email, [Required,MinLength(10),MaxLength(128)] string Password,[Required,MaxLength(60)] string DisplayName,string Role,bool GuardianConsent);
public record LoginDto([Required,EmailAddress] string Email,[Required] string Password);
public record ChildDto([Required,MaxLength(60)] string DisplayName,[Required,MinLength(10),MaxLength(128)] string Password,bool GuardianConsent);
public record AnswerDto(Guid QuestionId,Guid OptionId);
public record PaymentDto([MaxLength(80)] string? Reference,[Required,MaxLength(80)] string IdempotencyKey,string? StudentId);
public record ReviewDto(bool BankVerified,[Required,MaxLength(500)] string Note);
public record PublishDto(bool ConfirmTeacherReview);
public record ExamDto([Required,MaxLength(200)] string Title,[Required,MaxLength(1500)] string Description,int DurationMinutes,int PassPercentage);
public record OptionDto(string Key,string Text);
public record QuestionDto(string QuestionText,List<OptionDto> Options,string CorrectOptionKey,string Explanation,decimal Marks,string Topic,int DisplayOrder,string? DiagramKey=null,string? DiagramAlt=null);
public record ImportExamDto(string Key,string Title,string Description,int DurationMinutes,List<QuestionDto> Questions);
public record ImportDto(int SchemaVersion,string Language,string Medium,List<ImportExamDto> Exams);
public record SettingsDto(string PaymentInstructions,string ContactEmail,bool AcceptPayments);
public record RewardDto(int Threshold,bool Enabled);
public record ResetDto(string Password);
public class ApiError(int status,string message):Exception(message) { public int Status {get;}=status; }
public static class Input {
 public static void Validate(object value) {var results=new List<ValidationResult>();if(!Validator.TryValidateObject(value,new ValidationContext(value),results,true))throw new ApiError(400,string.Join(" ",results.Select(x=>x.ErrorMessage)));}
 public static void Check([System.Diagnostics.CodeAnalysis.DoesNotReturnIf(false)] bool condition,string message,int status=400) {if(!condition)throw new ApiError(status,message);}
}


public record ReferenceDto([Required,MinLength(4),MaxLength(80)] string Reference);
