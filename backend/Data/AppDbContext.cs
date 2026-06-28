using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SkillSathiAPI.Entities;

namespace SkillSathiAPI.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<StudentProfile> StudentProfiles { get; set; } = null!;
        public DbSet<RecruiterProfile> RecruiterProfiles { get; set; } = null!;
        public DbSet<Skill> Skills { get; set; } = null!;
        public DbSet<StudentSkill> StudentSkills { get; set; } = null!;
        public DbSet<Resume> Resumes { get; set; } = null!;
        public DbSet<Job> Jobs { get; set; } = null!;
        public DbSet<JobApplication> JobApplications { get; set; } = null!;
        public DbSet<ChatMessage> ChatMessages { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            
            // 1. StudentProfile 1:1 relationship with ApplicationUser
            builder.Entity<StudentProfile>()
                .HasKey(s => s.Id);

            builder.Entity<StudentProfile>()
                .HasOne(s => s.User)
                .WithOne()
                .HasForeignKey<StudentProfile>(s => s.Id)
                .OnDelete(DeleteBehavior.Cascade);

            // 2. RecruiterProfile 1:1 relationship with ApplicationUser
            builder.Entity<RecruiterProfile>()
                .HasKey(r => r.Id);

            builder.Entity<RecruiterProfile>()
                .HasOne(r => r.User)
                .WithOne()
                .HasForeignKey<RecruiterProfile>(r => r.Id)
                .OnDelete(DeleteBehavior.Cascade);

            // 3. Many-to-Many Join Table (StudentProfile <-> Skill)
            builder.Entity<StudentSkill>()
                .HasKey(ss => new { ss.StudentProfileId, ss.SkillId });

            builder.Entity<StudentSkill>()
                .HasOne(ss => ss.StudentProfile)
                .WithMany(s => s.StudentSkills)
                .HasForeignKey(ss => ss.StudentProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<StudentSkill>()
                .HasOne(ss => ss.Skill)
                .WithMany(s => s.StudentSkills)
                .HasForeignKey(ss => ss.SkillId)
                .OnDelete(DeleteBehavior.Cascade);

            // 4. Resume 1:1 relationship with StudentProfile
            builder.Entity<Resume>()
                .HasOne(r => r.StudentProfile)
                .WithOne(s => s.Resume)
                .HasForeignKey<Resume>(r => r.StudentProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            // 5. Job Entity relationships
            builder.Entity<Job>()
                .HasOne(j => j.RecruiterProfile)
                .WithMany()
                .HasForeignKey(j => j.RecruiterProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            // 6. JobApplication Entity relationships
            builder.Entity<JobApplication>()
                .HasOne(ja => ja.Job)
                .WithMany(j => j.Applications)
                .HasForeignKey(ja => ja.JobId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<JobApplication>()
                .HasOne(ja => ja.StudentProfile)
                .WithMany()
                .HasForeignKey(ja => ja.StudentProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            // 7. ChatMessage Entity relationships (DeleteBehavior.Restrict prevents multiple cascade paths)
            builder.Entity<ChatMessage>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<ChatMessage>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            // 8. Notification Entity relationships
            builder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
