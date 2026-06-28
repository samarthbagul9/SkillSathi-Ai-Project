using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace SkillSathiAPI.Services
{
    public class GeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GeminiService> _logger;

        public GeminiService(HttpClient httpClient, IConfiguration configuration, ILogger<GeminiService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string> GenerateTextAsync(string prompt)
        {
            var apiKey = _configuration["Gemini:ApiKey"];
            
            // Graceful Mock Fallback if API key is not configured
            if (string.IsNullOrEmpty(apiKey) || apiKey == "YOUR_GEMINI_API_KEY_HERE" || apiKey.Length < 10)
            {
                _logger.LogWarning("Gemini API key is not configured or invalid. Falling back to Mock AI responses.");
                return GetMockResponse(prompt);
            }

            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";
                
                var requestBody = new
                {
                    contents = new[]
                    {
                        new { parts = new[] { new { text = prompt } } }
                    }
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, content);
                if (!response.IsSuccessStatusCode)
                {
                    var errContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Gemini API returned error code {Code}: {Error}", response.StatusCode, errContent);
                    return GetMockResponse(prompt);
                }

                var responseString = await response.Content.ReadAsStringAsync();
                
                using var doc = JsonDocument.Parse(responseString);
                var text = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                // Remove markdown code blocks if the model returned them
                if (text != null)
                {
                    text = text.Trim();
                    if (text.StartsWith("```json"))
                    {
                        text = text.Substring(7);
                        if (text.EndsWith("```"))
                        {
                            text = text.Substring(0, text.Length - 3);
                        }
                    }
                    else if (text.StartsWith("```"))
                    {
                        text = text.Substring(3);
                        if (text.EndsWith("```"))
                        {
                            text = text.Substring(0, text.Length - 3);
                        }
                    }
                    return text.Trim();
                }

                return string.Empty;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Gemini API. Falling back to Mock AI.");
                return GetMockResponse(prompt);
            }
        }

        private string GetMockResponse(string prompt)
        {
            var promptLower = prompt.ToLower();

            // 1. Mock Interview Questions
            if (promptLower.Contains("interview") || promptLower.Contains("question"))
            {
                return @"
                [
                    { ""id"": 1, ""question"": ""Explain the life cycle of a React component and where you would make an API request."", ""category"": ""Technical"" },
                    { ""id"": 2, ""question"": ""How do you secure an ASP.NET Core Web API? Talk about JWT and claims-based authorization."", ""category"": ""Technical"" },
                    { ""id"": 3, ""question"": ""What is the difference between a clustered and non-clustered index in SQL Server?"", ""category"": ""Technical"" },
                    { ""id"": 4, ""question"": ""Describe a challenging technical problem you faced in a project and how you solved it."", ""category"": ""Behavioral"" },
                    { ""id"": 5, ""question"": ""How do you handle conflict within a development team of 5 members under tight deadlines?"", ""category"": ""Behavioral"" }
                ]";
            }

            // 2. Mock ATS Resume Analysis
            if (promptLower.Contains("ats") || promptLower.Contains("resume"))
            {
                return @"
                {
                    ""atsScore"": 76,
                    ""detectedSkills"": [""HTML5"", ""CSS3"", ""JavaScript"", ""React.js"", ""Git & GitHub""],
                    ""missingSkills"": [""ASP.NET Core Web API"", ""C#"", ""Docker"", ""SQL Server"", ""Redux Toolkit""],
                    ""feedback"": ""Your resume has a solid frontend foundation. However, to qualify for industry-level Full Stack Developer roles, you need to showcase backend development capabilities and containerization expertise. The layout is clean, but key industry terms are missing."",
                    ""improvementTips"": [
                        ""Incorporate C# and ASP.NET Core projects to highlight backend skills."",
                        ""Explain your experience with databases (e.g. MS SQL Server or PostgreSQL)."",
                        ""Add keywords related to RESTful APIs and containerization (Docker) to boost ATS scan rate."",
                        ""Quantify your accomplishments (e.g., 'Improved load times by 20% using lazy loading').""
                    ]
                }";
            }

            // 3. Mock Default response
            return @"{ ""message"": ""Mock AI response generated."" }";
        }
    }
}
