using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using SkillSathiAPI.DTOs;
using SkillSathiAPI.Entities;

namespace SkillSathiAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("Registering user: {Email}", request.Email);

            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return BadRequest(new { Message = "User with this email already exists." });
            }

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FullName = request.FullName,
                UserType = request.UserType
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description);
                return BadRequest(new { Message = "User registration failed.", Errors = errors });
            }

            _logger.LogInformation("Successfully registered user: {Email}", request.Email);
            return Ok(new { Message = "User registered successfully." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("User attempting login: {Email}", request.Email);

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            {
                _logger.LogWarning("Invalid login attempt for: {Email}", request.Email);
                return Unauthorized(new { Message = "Invalid email or password." });
            }

            if (!user.IsActive)
            {
                _logger.LogWarning("Login attempt for suspended user: {Email}", request.Email);
                return BadRequest(new { Message = "Your account has been suspended by an administrator. Please contact support." });
            }

            var token = GenerateJwtToken(user);

            _logger.LogInformation("Successfully authenticated user: {Email}", request.Email);

            return Ok(token);
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { Message = "User claims not found." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { Message = "User not found." });

            return Ok(new
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                UserType = user.UserType,
                CreatedAt = user.CreatedAt
            });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return NotFound(new { Message = "No account found with this email address." });
            }

            _logger.LogInformation("Password reset code requested for user: {Email}", request.Email);
            return Ok(new { Message = "Verification code generated successfully.", Code = "123456" });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.Code != "123456")
            {
                return BadRequest(new { Message = "Invalid verification code. Please use code '123456'." });
            }

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return NotFound(new { Message = "No account found with this email address." });
            }

            var removeResult = await _userManager.RemovePasswordAsync(user);
            if (!removeResult.Succeeded)
            {
                var errors = removeResult.Errors.Select(e => e.Description);
                return BadRequest(new { Message = "Password reset failed. Could not clear old password.", Errors = errors });
            }

            var addResult = await _userManager.AddPasswordAsync(user, request.NewPassword);
            if (!addResult.Succeeded)
            {
                var errors = addResult.Errors.Select(e => e.Description);
                return BadRequest(new { Message = "Password reset failed. Could not set new password.", Errors = errors });
            }

            _logger.LogInformation("Password reset successfully for user: {Email}", request.Email);
            return Ok(new { Message = "Password reset successfully. You can now login with your new password." });
        }

        private AuthResponse GenerateJwtToken(ApplicationUser user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                jwtSettings["Key"] ?? "SkillSathiAISecretSuperSecureKey1234567890!"));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.UserType) // Role claim maps directly to user type
            };

            var expiryMinutes = double.Parse(jwtSettings["DurationInMinutes"] ?? "120");
            var expiration = DateTime.UtcNow.AddMinutes(expiryMinutes);

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"] ?? "SkillSathiAPI",
                audience: jwtSettings["Audience"] ?? "SkillSathiClient",
                claims: claims,
                expires: expiration,
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return new AuthResponse
            {
                Token = tokenString,
                Expiration = expiration.ToString("o"),
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                UserType = user.UserType
            };
        }
    }
}
