using Microsoft.EntityFrameworkCore;
using ScholarshipExam.Infrastructure;
namespace ScholarshipExam.Api;
// The local SQLite development mode is deliberately serialized. PostgreSQL uses transaction-scoped advisory locks across instances.
public sealed class WorkLock(AppDb db) {
 private static readonly SemaphoreSlim local = new(1,1);
 public async Task<T> Run<T>(string key, Func<Task<T>> work) {
  var sqlite=db.Database.IsSqlite(); if(sqlite)await local.WaitAsync();
  try {await using var tx=await db.Database.BeginTransactionAsync();
   if(!sqlite)await db.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtextextended({"scholarship-write"}, 0))");
   var result=await work();await db.SaveChangesAsync();await tx.CommitAsync();return result;
  } finally {if(sqlite)local.Release();}
 }
}

