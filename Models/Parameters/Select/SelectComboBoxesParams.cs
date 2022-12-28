using System;

namespace GaHrmOnSiteApi.Models
{
    public class SelectSideCodeMakerParams
    {
        public string CompanyCode { get; set; }
        public string SideCode { get; set; }
    }
    
    public class SelectBranchByMakerParams
    {
        public string CompanyCode { get; set; }
        public string EmployeeCode { get; set; }
    }
    public class SelectDepartmentByMakerParams
    {
        public string CompanyCode { get; set; }
        public string EmployeeCode { get; set; }
        public string FormName { get; set; }
    }
}