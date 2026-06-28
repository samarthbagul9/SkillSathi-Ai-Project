using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkillSathiAPI.Data;
using SkillSathiAPI.Entities;
using SkillSathiAPI.Services;
using UglyToad.PdfPig;

namespace SkillSathiAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AIController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly GeminiService _geminiService;
        private readonly ILogger<AIController> _logger;

        public AIController(
            AppDbContext context,
            GeminiService geminiService,
            ILogger<AIController> logger)
        {
            _context = context;
            _geminiService = geminiService;
            _logger = logger;
        }

        // POST: api/ai/analyze-resume
        [HttpPost("analyze-resume")]
        public async Task<IActionResult> AnalyzeResume()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // 1. Fetch the student's resume
            var resume = await _context.Resumes.FirstOrDefaultAsync(r => r.StudentProfileId == userId);
            if (resume == null)
            {
                return BadRequest(new { Message = "No resume uploaded. Please upload a resume first." });
            }

            // 2. Fetch student profile to get target job title
            var profile = await _context.StudentProfiles.FirstOrDefaultAsync(s => s.Id == userId);
            var targetJobTitle = profile?.TargetJobTitle ?? "Software Engineer";

            try
            {
                _logger.LogInformation("Starting AI resume analysis for user: {UserId}", userId);

                // 3. Extract text content from resume
                string extractedText = string.Empty;
                
                if (System.IO.File.Exists(resume.FilePath))
                {
                    var extension = Path.GetExtension(resume.FileName).ToLower();
                    if (extension == ".pdf")
                    {
                        extractedText = ExtractTextFromPdf(resume.FilePath);
                    }
                    else
                    {
                        // Fallback for Word files in this dev environment
                        extractedText = $"Candidate Name: {profile?.User?.FullName}. Target Job Title: {targetJobTitle}. Bio: {profile?.Bio}. Education: {profile?.EducationDetails}";
                    }
                }

                if (string.IsNullOrWhiteSpace(extractedText))
                {
                    extractedText = "Empty resume text or file missing on server.";
                }

                // Limit extracted text to prevent blowing up prompt tokens
                if (extractedText.Length > 8000)
                {
                    extractedText = extractedText.Substring(0, 8000);
                }

                // 4. Fetch master skills list to pass as context
                var masterSkillsList = await _context.Skills.Select(s => s.Name).ToListAsync();
                var skillsContext = string.Join(", ", masterSkillsList);

                // 5. Construct the prompt for Gemini
                var prompt = $@"
You are an expert ATS (Applicant Tracking System) recruiter and career consultant.
Analyze the following resume text content of a student targeting the job title: '{targetJobTitle}'.
Compare the skills and experience listed in the resume against these industry-standard skills: [{skillsContext}].

Resume Text:
""{extractedText}""

Provide a JSON response with the following format. Your output must be valid, parseable JSON and nothing else. Do NOT wrap the JSON in markdown blocks like ```json.
{{
  ""atsScore"": 78, // an integer score between 0 and 100 representing how well the resume matches the target job
  ""detectedSkills"": [""React"", ""JavaScript""], // skills from the resume that match the master list
  ""missingSkills"": [""Docker"", ""ASP.NET Core Web API""], // crucial skills from the master list that are missing in the resume but highly relevant for a '{targetJobTitle}'
  ""feedback"": ""Constructive, professional review paragraph detailing strengths, layout, and readability improvements."",
  ""improvementTips"": [
    ""Actionable step 1 to optimize keywords."",
    ""Actionable step 2 to showcase projects."",
    ""Actionable step 3 for layout formatting.""
  ]
}}
";

                // 6. Call Gemini Service
                var aiResponse = await _geminiService.GenerateTextAsync(prompt);

                // 7. Parse response to validate and save ATS score
                int atsScore = 70; // default fallback
                try
                {
                    using var doc = JsonDocument.Parse(aiResponse);
                    if (doc.RootElement.TryGetProperty("atsScore", out var scoreProp))
                    {
                        atsScore = scoreProp.GetInt32();
                    }
                }
                catch (Exception jsonEx)
                {
                    _logger.LogWarning(jsonEx, "Failed to parse ATS score from Gemini response. Using default score. Raw AI output: {Raw}", aiResponse);
                }

                // 8. Update Resume Database Record
                resume.AtsScore = atsScore;
                resume.RawTextContent = extractedText;
                resume.FeedbackJson = aiResponse;

                _context.Entry(resume).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully completed AI resume analysis for user: {UserId}. ATS Score: {Score}", userId, atsScore);

                return Ok(new
                {
                    Message = "Resume analysis completed successfully.",
                    AtsScore = atsScore,
                    Analysis = aiResponse
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during AI resume analysis for user {UserId}", userId);
                return StatusCode(500, new { Message = "An error occurred during AI analysis." });
            }
        }

        // GET: api/ai/resume-analysis
        [HttpGet("resume-analysis")]
        public async Task<IActionResult> GetResumeAnalysis()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var resume = await _context.Resumes.FirstOrDefaultAsync(r => r.StudentProfileId == userId);
            if (resume == null)
                return NotFound(new { Message = "No resume uploaded." });

            if (resume.AtsScore == null || string.IsNullOrEmpty(resume.FeedbackJson))
                return BadRequest(new { Message = "Resume has not been analyzed yet. Please trigger analysis first." });

            return Ok(new
            {
                AtsScore = resume.AtsScore,
                AnalysisJson = resume.FeedbackJson
            });
        }

        // GET: api/ai/mock-interview
        [HttpGet("mock-interview")]
        public async Task<IActionResult> GetMockInterviewQuestions()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var profile = await _context.StudentProfiles
                .Include(s => s.Resume)
                .FirstOrDefaultAsync(s => s.Id == userId);

            if (profile == null)
                return NotFound(new { Message = "Student profile not found." });

            var targetJobTitle = profile.TargetJobTitle;
            var resumeText = profile.Resume?.RawTextContent ?? "No resume uploaded yet. Empty profile.";

            try
            {
                _logger.LogInformation("Generating AI Mock Interview questions for user: {UserId} targeting {Role}", userId, targetJobTitle);

                var prompt = $@"
You are an expert technical interviewer hiring for a '{targetJobTitle}' role.
Based on the candidate's resume text details below, generate exactly 5 custom interview questions:
- 3 technical questions targeting their skill stack and target job requirements.
- 2 behavioral/situational questions to test their collaboration and problem-solving abilities in a team environment.

Candidate Resume Details:
""{resumeText}""

Provide a JSON response representing an array of questions. Your output must be valid, parseable JSON and nothing else. Do NOT wrap the JSON in markdown blocks like ```json.
[
  {{
    ""id"": 1,
    ""question"": ""Tailored technical or behavioral question string here"",
    ""category"": ""Technical"" // 'Technical' or 'Behavioral'
  }},
  ...
]
";

                var aiResponse = await _geminiService.GenerateTextAsync(prompt);
                
                // Validate that it's parseable JSON array
                bool isValidArray = false;
                try
                {
                    using var doc = JsonDocument.Parse(aiResponse);
                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        isValidArray = true;
                    }
                }
                catch (Exception jsonEx)
                {
                    _logger.LogWarning(jsonEx, "Gemini interview questions output was not a valid JSON array.");
                }

                if (!isValidArray)
                {
                    _logger.LogWarning("Gemini output was invalid. Falling back to default mock questions.");
                    aiResponse = @"[
                        { ""id"": 1, ""question"": ""Explain the life cycle of a React component and where you would make an API request."", ""category"": ""Technical"" },
                        { ""id"": 2, ""question"": ""How do you secure an ASP.NET Core Web API? Talk about JWT and claims-based authorization."", ""category"": ""Technical"" },
                        { ""id"": 3, ""question"": ""What is the difference between a clustered and non-clustered index in SQL Server."", ""category"": ""Technical"" },
                        { ""id"": 4, ""question"": ""Describe a challenging technical problem you faced in a project and how you solved it."", ""category"": ""Behavioral"" },
                        { ""id"": 5, ""question"": ""How do you handle conflict within a development team of 5 members under tight deadlines?"", ""category"": ""Behavioral"" }
                    ]";
                }

                return Content(aiResponse, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating AI interview questions for user {UserId}", userId);
                return StatusCode(500, new { Message = "An error occurred during interview generation." });
            }
        }

        private string ExtractTextFromPdf(string filePath)
        {
            try
            {
                var text = new StringBuilder();
                using (var pdf = PdfDocument.Open(filePath))
                {
                    foreach (var page in pdf.GetPages())
                    {
                        text.Append(page.Text);
                        text.Append(" ");
                    }
                }
                return text.ToString().Trim();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PdfPig failed to extract text from PDF at path: {Path}", filePath);
                return string.Empty;
            }
        }
    }
}
