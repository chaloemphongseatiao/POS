using System;

namespace GaHrmOnSiteApi.Models
{
    public class Add_Shift_By_EmployeeParams
    {
        public string Document_Number { get; set; }
        public DateTime Document_Date { get; set; }
        public string Document_By { get; set; }
        public string Side_Code { get; set; }
        public string Side_Name { get; set; }
        public string Branch_Code { get; set; }
        public string Branch_Name { get; set; }
        public string Department_Code { get; set; }
        public string Department_Name { get; set; }
        public DateTime Date_Start { get; set; }
        public DateTime Date_End { get; set; }
        public DateTime In1 { get; set; }
        public DateTime Out1 { get; set; }
        public DateTime In2 { get; set; }
        public DateTime Out2 { get; set; }
        public string Approve_Chk { get; set; }
        public string Approve_Code_Site { get; set; }
        public string Approve_Name_Site { get; set; }


    }
}