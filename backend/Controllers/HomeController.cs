using Microsoft.AspNetCore.Mvc;

namespace SkillSathiAPI.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
