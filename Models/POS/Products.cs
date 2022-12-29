using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace POSApi.Models
{
    public class Products
    {
        [Key]
        [Column(Order = 1)]
        public string CompanyCode { get; set; }
        [Key]
        [Column(Order = 2)]
        public string ProductID { get; set; }
        public string ProductName { get; set; }
        public string Status { get; set; }
        public string CategoryID { get; set; }
        // public Category Category { get; set; }
    }
}