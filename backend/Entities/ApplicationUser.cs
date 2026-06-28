using Microsoft.AspNetCore.Identity;
using System;

namespace SkillSathiAPI.Entities
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
        public string UserType { get; set; } = string.Empty; // "Student", "Recruiter", "Admin"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
    }
}
