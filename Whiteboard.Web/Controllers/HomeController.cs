/*
    Ólafur Jóhannsson
    Háskólinn í Reykjavík
    Vefforritun II
*/

using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Web;
using System.Web.Mvc;

namespace Whiteboard.Web.Controllers
{
    public class HomeController : Controller
    {
        /// <summary>
        /// Function that returns our page, if our dynamic key/value pair imagedata contains value it is populated
        /// </summary>
        /// <returns>Our index view page</returns>
        public ActionResult Index()
        {
            var data = TempData["ImageData"];
            ViewBag.ImageData = data;
            return View();
        }

        /// <summary>
        /// Loads all templates
        /// </summary>
        /// <returns>Json array with base 64 strings of each template image</returns>
        public JsonResult LoadTemplates()
        {
            byte[] bytes;
            var base64 = new List<string>();
            var path = Server.MapPath("/Uploads/templates/");
            DirectoryInfo dir = new DirectoryInfo(path);
            try
            {
                foreach (var file in dir.GetFiles("*"))
                {
                    if (file.Extension == ".png")
                    {
                        bytes = System.IO.File.ReadAllBytes(file.FullName);
                        base64.Add(Convert.ToBase64String(bytes));
                    }
                }
            }
            catch (Exception e)
            {
                return Json(e, JsonRequestBehavior.AllowGet);
            }
            return Json(base64.ToArray(), JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Function that loads an image from the filesystem and returns a base64 string inside a dynamic key/value pair
        /// </summary>
        /// <param name="image">Image from the file system</param>
        /// <returns>Redirects us to our index page</returns>
        [HttpPost]
        public ActionResult LoadImage(HttpPostedFileBase image)
        {
            // Convert our image to binary which is then converted to a base64 string and prepended a string with png values and returned in a dynamic key/value pair
            try
            {
                byte[] imgData;
                using (var reader = new BinaryReader(image.InputStream))
                {
                    imgData = reader.ReadBytes(image.ContentLength);
                }

                var data = "data:image/png;base64," + Convert.ToBase64String(imgData);
                TempData["ImageData"] = data;
                return RedirectToAction("Index");
            }
            catch (Exception e)
            {
                return RedirectToAction("Index");
            }
        }

        /// <summary>
        /// Function that takes a base64 string as parameter and converts it to an image object and saves it relative to the server
        /// </summary>
        /// <param name="imageData">Base 64 string</param>
        /// <returns>Returns json data, our path if successfull, the error message if unsuccessfull</returns>
        [HttpPost]
        public JsonResult UploadImage(string imageData)
        {
            // Get our relative path and convert our base64 string to an image object which we continue to save on the server
            string path = GetPath();
            try
            {
                byte[] data = Convert.FromBase64String(imageData);
                Image image;
                using (var memoryStream = new MemoryStream(data))
                {
                    image = Image.FromStream(memoryStream);
                }

                image.Save(path);
            }
            catch (Exception e)
            {
                return Json(e.Message, JsonRequestBehavior.AllowGet);
            }
            string msg = string.Format("Image saved in format .png at location: {0}", path);
            return Json(msg, JsonRequestBehavior.AllowGet);
        }


        /// <summary>
        /// Function that is supplied a base64 string object which is converted to a image object and then saved on the server
        /// </summary>
        /// <param name="imageData">Base64 string</param>
        /// <returns>Returns a json object contains our base64 string, or if error occurs, the message in the error object</returns>
        [HttpPost]
        public JsonResult UploadTemplate(string imageData)
        {
            // We are saving a template so we supply a parameter
            string path = GetPath(true);
            try
            {
                // Convert our base64 to bytes and convert it to an image object and save it relative to the server
                byte[] data = Convert.FromBase64String(imageData);
                Image image;
                using (var memoryStream = new MemoryStream(data))
                {
                    image = Image.FromStream(memoryStream);
                }

                image.Save(path);
            }
            catch (Exception e)
            {
                return Json(e.Message, JsonRequestBehavior.AllowGet);
            }
            return Json(imageData, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Function that returns the relative path - if supplied with a bool true parameter it appends /templates/ to the path
        /// </summary>
        /// <param name="isTemplate">Parameter that tells us if it is a template or not, default is false</param>
        /// <returns>Our path relative to the server</returns>
        private string GetPath(bool isTemplate = false)
        {
            string path = isTemplate ? "/Uploads/templates/" : "/Uploads/";
            return Server.MapPath(path) + DateTime.Now.ToString().Replace("/", "-").Replace(" ", "- ").Replace(":", "") + ".png";
        }
    }
}
