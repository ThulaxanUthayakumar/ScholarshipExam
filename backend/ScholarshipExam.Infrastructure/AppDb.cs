using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ScholarshipExam.Core;
namespace ScholarshipExam.Infrastructure;
public class ApplicationUser : IdentityUser { public string DisplayName { get; set; } = ""; public DateTime ConsentAt { get; set; } public bool Disabled { get; set; } }
public class AppDb(DbContextOptions<AppDb> options) : IdentityDbContext<ApplicationUser>(options) {
 public DbSet<Exam> Exams => Set<Exam>(); public DbSet<Question> Questions => Set<Question>(); public DbSet<QuestionOption> Options => Set<QuestionOption>();
 public DbSet<ParentChild> ParentChildren => Set<ParentChild>(); public DbSet<Payment> Payments => Set<Payment>(); public DbSet<Subscription> Subscriptions => Set<Subscription>(); public DbSet<Entitlement> Entitlements => Set<Entitlement>(); public DbSet<ExamAttempt> Attempts => Set<ExamAttempt>(); public DbSet<StudentAnswer> Answers => Set<StudentAnswer>(); public DbSet<Reward> Rewards => Set<Reward>(); public DbSet<StudentReward> StudentRewards => Set<StudentReward>(); public DbSet<AuditRecord> Audit => Set<AuditRecord>(); public DbSet<PlatformSettings> Settings => Set<PlatformSettings>();
 protected override void OnModelCreating(ModelBuilder b) {
  base.OnModelCreating(b);
  b.Entity<Exam>().HasIndex(x=>x.ExternalKey).IsUnique(); b.Entity<Exam>().Property(x=>x.Title).HasMaxLength(200);
  b.Entity<Exam>().HasMany(x=>x.Questions).WithOne().HasForeignKey(x=>x.ExamId).OnDelete(DeleteBehavior.Cascade);
  b.Entity<Question>().HasMany(x=>x.Options).WithOne().HasForeignKey(x=>x.QuestionId).OnDelete(DeleteBehavior.Cascade);
  b.Entity<Question>().Property(x=>x.Marks).HasPrecision(5,2);
  b.Entity<Question>().HasIndex(x=>new{x.ExamId,x.DisplayOrder}).IsUnique();
  b.Entity<QuestionOption>().HasIndex(x=>new{x.QuestionId,x.Key}).IsUnique();
  b.Entity<ParentChild>().HasIndex(x=>new{x.ParentId,x.ChildId}).IsUnique();
  b.Entity<ParentChild>().HasOne<ApplicationUser>().WithMany().HasForeignKey(x=>x.ParentId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<ParentChild>().HasOne<ApplicationUser>().WithMany().HasForeignKey(x=>x.ChildId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<Payment>().HasIndex(x=>new{x.PayerId,x.IdempotencyKey}).IsUnique(); b.Entity<Payment>().HasIndex(x=>x.Reference).IsUnique(); b.Entity<Payment>().Property(x=>x.Amount).HasPrecision(12,2);
  b.Entity<Payment>().HasOne<ApplicationUser>().WithMany().HasForeignKey(x=>x.StudentId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<Payment>().HasOne<ApplicationUser>().WithMany().HasForeignKey(x=>x.PayerId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<Subscription>().HasIndex(x=>x.PaymentId).IsUnique(); b.Entity<Subscription>().HasOne<Payment>().WithMany().HasForeignKey(x=>x.PaymentId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<Subscription>().HasOne<ApplicationUser>().WithMany().HasForeignKey(x=>x.StudentId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<Subscription>().HasMany(x=>x.Entitlements).WithOne().HasForeignKey(x=>x.SubscriptionId).OnDelete(DeleteBehavior.Cascade);
  b.Entity<Entitlement>().HasIndex(x=>new{x.SubscriptionId,x.ExamId}).IsUnique(); b.Entity<Entitlement>().HasOne<Exam>().WithMany().HasForeignKey(x=>x.ExamId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<ExamAttempt>().HasIndex(x=>x.EntitlementId).IsUnique(); b.Entity<ExamAttempt>().HasIndex(x=>new{x.StudentId,x.ExamId});
  b.Entity<ExamAttempt>().HasOne<ApplicationUser>().WithMany().HasForeignKey(x=>x.StudentId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<ExamAttempt>().HasOne<Exam>().WithMany().HasForeignKey(x=>x.ExamId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<ExamAttempt>().HasOne<Entitlement>().WithMany().HasForeignKey(x=>x.EntitlementId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<ExamAttempt>().HasOne<Subscription>().WithMany().HasForeignKey(x=>x.SubscriptionId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<ExamAttempt>().HasMany(x=>x.Answers).WithOne().HasForeignKey(x=>x.AttemptId).OnDelete(DeleteBehavior.Cascade);
  b.Entity<ExamAttempt>().Property(x=>x.Score).HasPrecision(8,2); b.Entity<ExamAttempt>().Property(x=>x.Percentage).HasPrecision(5,2);
  b.Entity<StudentAnswer>().HasIndex(x=>new{x.AttemptId,x.QuestionId}).IsUnique(); b.Entity<StudentAnswer>().HasOne<Question>().WithMany().HasForeignKey(x=>x.QuestionId).OnDelete(DeleteBehavior.Restrict); b.Entity<StudentAnswer>().HasOne<QuestionOption>().WithMany().HasForeignKey(x=>x.OptionId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<Reward>().HasIndex(x=>x.Code).IsUnique(); b.Entity<StudentReward>().HasIndex(x=>x.AwardKey).IsUnique();
  b.Entity<StudentReward>().HasOne<ApplicationUser>().WithMany().HasForeignKey(x=>x.StudentId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<StudentReward>().HasOne<ExamAttempt>().WithMany().HasForeignKey(x=>x.AttemptId).OnDelete(DeleteBehavior.Restrict);
  b.Entity<StudentReward>().HasOne<Subscription>().WithMany().HasForeignKey(x=>x.SubscriptionId).OnDelete(DeleteBehavior.Restrict);
  foreach(var entity in b.Model.GetEntityTypes()) if(typeof(Entity).IsAssignableFrom(entity.ClrType)) b.Entity(entity.ClrType).Property("Id").ValueGeneratedNever();
  foreach(var entity in b.Model.GetEntityTypes()) foreach(var property in entity.GetProperties()) {
   if(property.ClrType==typeof(DateTime))property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime,DateTime>(v=>v,v=>DateTime.SpecifyKind(v,DateTimeKind.Utc)));
   if(property.ClrType==typeof(DateTime?))property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime?,DateTime?>(v=>v,v=>v.HasValue?DateTime.SpecifyKind(v.Value,DateTimeKind.Utc):null));
  }
 }
}

