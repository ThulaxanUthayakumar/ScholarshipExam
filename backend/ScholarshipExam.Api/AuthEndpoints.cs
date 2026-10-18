using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ScholarshipExam.Infrastructure;
using ScholarshipExam.Core;
namespace ScholarshipExam.Api;
public static class AuthEndpoints {
 public static string UserId(this ClaimsPrincipal user)=>user.FindFirstValue(ClaimTypes.NameIdentifier)??throw new ApiError(401,"Sign in required.");
 public static void MapAuth(this WebApplication app){
  var auth=app.MapGroup("/api/auth").RequireRateLimiting("auth");
  auth.MapPost("/register",async(RegisterDto dto,UserManager<ApplicationUser> users,AppDb db,WorkLock gate)=>{
   Input.Validate(dto);Input.Check(dto.Role is "Student" or "Parent","Choose Student or Parent.");Input.Check(dto.GuardianConsent,"Parent or guardian consent is required.");
   return await gate.Run("accounts",async()=>{var user=new ApplicationUser{UserName=dto.Email.Trim(),Email=dto.Email.Trim(),DisplayName=dto.DisplayName.Trim(),ConsentAt=DateTime.UtcNow};var created=await users.CreateAsync(user,dto.Password);Input.Check(created.Succeeded,string.Join(" ",created.Errors.Select(x=>x.Description)));var role=await users.AddToRoleAsync(user,dto.Role);Input.Check(role.Succeeded,"Could not assign role.");return Results.Created("/api/auth/me",new{user.Id});});
  });
  auth.MapPost("/login",async(LoginDto dto,UserManager<ApplicationUser> users,SignInManager<ApplicationUser> signIn)=>{
   Input.Validate(dto);var user=await users.FindByEmailAsync(dto.Email.Trim());if(user==null||user.Disabled)return Results.Problem("Invalid email or password.",statusCode:401);
   var result=await signIn.CheckPasswordSignInAsync(user,dto.Password,true);if(!result.Succeeded)return Results.Problem("Invalid credentials or account temporarily locked.",statusCode:401);
   var principal=await signIn.CreateUserPrincipalAsync(user);return Results.SignIn(principal,authenticationScheme:IdentityConstants.BearerScheme);
  });
  app.MapGet("/api/auth/me",async(ClaimsPrincipal actor,UserManager<ApplicationUser> users)=>{var u=await users.FindByIdAsync(actor.UserId());return Results.Ok(new{u!.Id,u.Email,u.DisplayName,roles=await users.GetRolesAsync(u)});}).RequireAuthorization();
  var parent=app.MapGroup("/api/parent").RequireAuthorization(p=>p.RequireRole("Parent"));
  parent.MapPost("/children",async(ChildDto dto,ClaimsPrincipal actor,UserManager<ApplicationUser> users,AppDb db,WorkLock gate)=>{
   Input.Validate(dto);Input.Check(dto.GuardianConsent,"Guardian consent required.");return await gate.Run("accounts",async()=>{Input.Check(await db.ParentChildren.CountAsync(x=>x.ParentId==actor.UserId())<5,"Maximum five child profiles.");var email=$"child-{Guid.NewGuid():N}@students.local";var u=new ApplicationUser{UserName=email,Email=email,DisplayName=dto.DisplayName.Trim(),ConsentAt=DateTime.UtcNow};var result=await users.CreateAsync(u,dto.Password);Input.Check(result.Succeeded,string.Join(" ",result.Errors.Select(x=>x.Description)));var role=await users.AddToRoleAsync(u,"Student");Input.Check(role.Succeeded,"Role assignment failed.");db.ParentChildren.Add(new ParentChild{ParentId=actor.UserId(),ChildId=u.Id});return Results.Ok(new{u.Id,u.Email,u.DisplayName});});
  });
  parent.MapGet("/children",async(ClaimsPrincipal actor,AppDb db)=>await (from link in db.ParentChildren join child in db.Users on link.ChildId equals child.Id where link.ParentId==actor.UserId() select new{child.Id,child.Email,child.DisplayName}).ToListAsync());
  parent.MapPost("/children/{id}/reset-password",async(string id,ResetDto dto,ClaimsPrincipal actor,UserManager<ApplicationUser> users,AppDb db)=>{Input.Check(await db.ParentChildren.AnyAsync(x=>x.ParentId==actor.UserId()&&x.ChildId==id),"Not found.",404);var u=await users.FindByIdAsync(id);var token=await users.GeneratePasswordResetTokenAsync(u!);var result=await users.ResetPasswordAsync(u!,token,dto.Password);Input.Check(result.Succeeded,string.Join(" ",result.Errors.Select(x=>x.Description)));return Results.Ok(new{changed=true});});
 }
}

