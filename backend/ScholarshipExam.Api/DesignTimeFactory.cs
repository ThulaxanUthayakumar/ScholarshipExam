using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using ScholarshipExam.Infrastructure;
namespace ScholarshipExam.Api;
public class DesignTimeFactory:IDesignTimeDbContextFactory<AppDb>{public AppDb CreateDbContext(string[] args)=>new(new DbContextOptionsBuilder<AppDb>().UseNpgsql(Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")??"Host=localhost;Database=scholarship;Username=scholarship",o=>o.MigrationsAssembly("ScholarshipExam.Api")).Options);}
