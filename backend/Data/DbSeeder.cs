using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SkillSathiAPI.Entities;

namespace SkillSathiAPI.Data
{
    public static class DbSeeder
    {
        public static async Task SeedDataAsync(AppDbContext context, UserManager<ApplicationUser> userManager)
        {
            // Ensure database is created/migrated
            await context.Database.EnsureCreatedAsync();

            // 1. Seed Admin User if not exists
            var adminEmail = "admin@skillsathi.com";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    FullName = "System Administrator",
                    UserType = "Admin",
                    IsActive = true,
                    EmailConfirmed = true
                };
                await userManager.CreateAsync(adminUser, "AdminPassword123");
            }

            // 2. Seed Skills if not exists
            if (await context.Skills.AnyAsync())
            {
                return; // Skills already seeded
            }

            var skills = new List<Skill>
            {
                // Frontend
                new Skill { Name = "HTML5", Category = "Frontend" },
                new Skill { Name = "CSS3", Category = "Frontend" },
                new Skill { Name = "JavaScript", Category = "Frontend" },
                new Skill { Name = "React.js", Category = "Frontend" },
                new Skill { Name = "Angular", Category = "Frontend" },
                new Skill { Name = "Vue.js", Category = "Frontend" },
                new Skill { Name = "Bootstrap", Category = "Frontend" },
                new Skill { Name = "Tailwind CSS", Category = "Frontend" },
                new Skill { Name = "Redux Toolkit", Category = "Frontend" },
                new Skill { Name = "TypeScript", Category = "Frontend" },

                // Backend
                new Skill { Name = "C#", Category = "Backend" },
                new Skill { Name = ".NET Core / 8.0", Category = "Backend" },
                new Skill { Name = "ASP.NET Core Web API", Category = "Backend" },
                new Skill { Name = "Java", Category = "Backend" },
                new Skill { Name = "Spring Boot", Category = "Backend" },
                new Skill { Name = "Python", Category = "Backend" },
                new Skill { Name = "Django", Category = "Backend" },
                new Skill { Name = "Node.js", Category = "Backend" },
                new Skill { Name = "Express.js", Category = "Backend" },
                new Skill { Name = "Go (Golang)", Category = "Backend" },

                // Database
                new Skill { Name = "Microsoft SQL Server", Category = "Database" },
                new Skill { Name = "PostgreSQL", Category = "Database" },
                new Skill { Name = "MySQL", Category = "Database" },
                new Skill { Name = "MongoDB", Category = "Database" },
                new Skill { Name = "Redis", Category = "Database" },

                // DevOps & Cloud
                new Skill { Name = "Docker", Category = "DevOps" },
                new Skill { Name = "Kubernetes", Category = "DevOps" },
                new Skill { Name = "Git & GitHub", Category = "DevOps" },
                new Skill { Name = "AWS (Amazon Web Services)", Category = "DevOps" },
                new Skill { Name = "Microsoft Azure", Category = "DevOps" },
                new Skill { Name = "CI/CD Pipelines", Category = "DevOps" },

                // AI & Data Science
                new Skill { Name = "Machine Learning", Category = "AI & Data" },
                new Skill { Name = "Deep Learning", Category = "AI & Data" },
                new Skill { Name = "Natural Language Processing (NLP)", Category = "AI & Data" },
                new Skill { Name = "Pandas / NumPy", Category = "AI & Data" },
                new Skill { Name = "Data Visualization", Category = "AI & Data" },

                // Soft Skills
                new Skill { Name = "Communication", Category = "Soft Skills" },
                new Skill { Name = "Team Collaboration", Category = "Soft Skills" },
                new Skill { Name = "Problem Solving", Category = "Soft Skills" },
                new Skill { Name = "Leadership", Category = "Soft Skills" }
            };

            await context.Skills.AddRangeAsync(skills);
            await context.SaveChangesAsync();
        }
    }
}
