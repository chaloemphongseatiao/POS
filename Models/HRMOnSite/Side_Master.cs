using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace POSApi.Models
{
    public class Side_Master
    {
        [Key]
        [Column(Order = 1)]
        public string Company_Code { get; set; }
        [Key]
        [Column(Order = 2)]
        public string Side_Code { get; set; }
        public string Side_Name { get; set; }
    }
}