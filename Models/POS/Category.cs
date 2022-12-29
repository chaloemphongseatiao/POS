using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace POSApi.Models
{
    public class Category
    {
        [Key]
        [Column(Order = 1)]
        public string CompanyCode { get; set; }
        [Key]
        [Column(Order = 2)]
        public string CategoryID { get; set; }
        public string CategoryName { get; set; }
        public string Status { get; set; }
        // public List<Products> Products { get; set; }
    }
}