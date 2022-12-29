using System;

namespace POSApi.Models
{
    public class SelectProcuct
    {
        public string? CompanyCode { get; set; }
        public string? ProductID { get; set; }
        public string? ProductName { get; set; }
        public int page { get; set; }
        public int pageSize { get; set; }

    }

}