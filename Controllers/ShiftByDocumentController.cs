using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using POSApi.Models;

namespace POSApi.Controllers
{
    [AllowAnonymous]
    [Produces("application/json")]
    [Route("api/[controller]")]
    [ApiController]
    public class ShiftByDocumentController : ControllerBase
    {
        private readonly POSApiContext _context;
        public ShiftByDocumentController(POSApiContext dbContext)
        {
            _context = dbContext;
        }
        

        // แสดงเอกสาร เปลี่ยนแปลงเวลาทำงาน
        // [HttpPost]
        // [Route("[action]")]
        // public async Task<ActionResult<StatusMessageExt<List<Shift_By_Employee_Header>>>> GetShiftByDocument([FromBody] SelectShiftBydocumentParams parameters)
        // {
        //     StatusMessageExt<List<Shift_By_Employee_Header>> result = new StatusMessageExt<List<Shift_By_Employee_Header>>();
        //     try
        //     {

        //          var query =  _context.Shift_By_Employee_Headers.AsNoTracking().Where
        //         (x => x.Side_Code == parameters.SideCode
        //         && x.Branch_Code == parameters.BranchCode
        //         && x.Department_Code == parameters.DepartmentCode).AsQueryable();
                              
               
        //         var recordset = await query.AsNoTracking().AsyncGetPaged(parameters.page, parameters.pageSize);
        //         result.page = recordset.CurrentPage;
        //         result.pagesize = recordset.PageSize;
        //         result.total = recordset.RowCount;
        //         result.totalpage = recordset.PageCount;
        //         result.data = recordset.Results.ToList();
               
        //         result.success = true;
        //     }
        //     catch (Exception ex)
        //     {
        //         result.success = false;
        //         result.message = ex.Message;
        //     }
        //     return result;
        // }
    }

}