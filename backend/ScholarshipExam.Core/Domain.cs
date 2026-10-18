namespace ScholarshipExam.Core;
public abstract class Entity { public Guid Id { get; set; } = Guid.NewGuid(); public DateTime CreatedAt { get; set; } = DateTime.UtcNow; }
public class Exam : Entity {
 public string ExternalKey { get; set; } = ""; public string Title { get; set; } = ""; public string Description { get; set; } = "";
 public int DurationMinutes { get; set; } = 60; public int PassPercentage { get; set; } = 60;
 public string Status { get; set; } = "Draft"; public bool TeacherReviewed { get; set; } public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
 public string ImportHash { get; set; } = ""; public List<Question> Questions { get; set; } = [];
}
public class Question : Entity { public Guid ExamId { get; set; } public string QuestionText { get; set; } = ""; public string Explanation { get; set; } = ""; public string Topic { get; set; } = ""; public decimal Marks { get; set; } = 2.5m; public string? DiagramKey { get; set; } public string? DiagramAlt { get; set; } public int DisplayOrder { get; set; } public List<QuestionOption> Options { get; set; } = []; }
public class QuestionOption : Entity { public Guid QuestionId { get; set; } public string Key { get; set; } = ""; public string Text { get; set; } = ""; public bool IsCorrect { get; set; } }
public class ParentChild : Entity { public string ParentId { get; set; } = ""; public string ChildId { get; set; } = ""; }
public class Payment : Entity { public string StudentId { get; set; } = ""; public string PayerId { get; set; } = ""; public string IdempotencyKey { get; set; } = ""; public string? Reference { get; set; } public decimal Amount { get; set; } = 500m; public string Currency { get; set; } = "LKR"; public string Status { get; set; } = "Pending"; public string ReviewNote { get; set; } = ""; public DateTime? ReviewedAt { get; set; } public string? ReviewedBy { get; set; } }
public class Subscription : Entity { public string StudentId { get; set; } = ""; public Guid PaymentId { get; set; } public string Status { get; set; } = "Active"; public List<Entitlement> Entitlements { get; set; } = []; }
public class Entitlement : Entity { public Guid SubscriptionId { get; set; } public Guid ExamId { get; set; } public bool Used { get; set; } }
public class ExamAttempt : Entity { public string StudentId { get; set; } = ""; public Guid ExamId { get; set; } public Guid EntitlementId { get; set; } public Guid SubscriptionId { get; set; } public DateTime ExpiresAt { get; set; } public DateTime? SubmittedAt { get; set; } public string Status { get; set; } = "Active"; public decimal Score { get; set; } public decimal Percentage { get; set; } public bool Passed { get; set; } public List<StudentAnswer> Answers { get; set; } = []; }
public class StudentAnswer : Entity { public Guid AttemptId { get; set; } public Guid QuestionId { get; set; } public Guid OptionId { get; set; } }
public class Reward : Entity { public string Code { get; set; } = ""; public string Title { get; set; } = ""; public int Threshold { get; set; } public bool Enabled { get; set; } = true; }
public class StudentReward : Entity { public string StudentId { get; set; } = ""; public Guid AttemptId { get; set; } public Guid SubscriptionId { get; set; } public string Code { get; set; } = ""; public string AwardKey { get; set; } = ""; }
public class AuditRecord : Entity { public string ActorId { get; set; } = ""; public string Action { get; set; } = ""; public string Target { get; set; } = ""; public string Note { get; set; } = ""; }
public class PlatformSettings { public int Id { get; set; } = 1; public string PaymentInstructions { get; set; } = ""; public string ContactEmail { get; set; } = ""; public bool AcceptPayments { get; set; } }
public static class Scoring {
 public static decimal Percentage(decimal marks, decimal total) => total <= 0 ? 0 : decimal.Round(marks * 100 / total, 2);
 public static string[] Badges(decimal percentage) => percentage >= 80 ? ["SCHOLARSHIP_STAR", "EXCELLENT_ACHIEVER"] : percentage >= 60 ? ["SCHOLARSHIP_STAR"] : [];
 public static bool Champion(IEnumerable<(Guid ExamId, decimal Percentage)> results) => results.Where(x => x.Percentage >= 60).Select(x => x.ExamId).Distinct().Count() >= 5;
}

