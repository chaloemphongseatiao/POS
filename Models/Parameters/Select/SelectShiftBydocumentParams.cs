using System;

namespace GaHrmOnSiteApi.Models
{
    public class SelectShiftBydocumentParams
    {
        public string SideCode { get; set; }
         public string BranchCode { get; set; }
         public string DepartmentCode { get; set; }
         public int page { get; set; }
         public int pageSize { get; set; }
         
    }
}