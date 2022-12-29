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
    public class ProductsController : ControllerBase
    {
        private readonly POSApiContext _context;
        public ProductsController(POSApiContext dbContext)
        {
            _context = dbContext;
        }
        

       
        [HttpPost]
        [Route("[action]")]
        public async Task<ActionResult<StatusMessageExt<List<Products>>>> GetProducts([FromBody] SelectProcuct parameters)
        {
            StatusMessageExt<List<Products>> result = new StatusMessageExt<List<Products>>();
            try
            {
                 var query =  _context.Products.AsNoTracking().Where
                (x =>x.CompanyCode.Contains(parameters.CompanyCode) 
                && x.ProductID.Contains(parameters.ProductID)
                && x.ProductName.Contains(parameters.ProductName)).AsQueryable();
                              
                var recordset = await query.AsNoTracking().AsyncGetPaged(parameters.page, parameters.pageSize);
                result.page = recordset.CurrentPage;
                result.pagesize = recordset.PageSize;
                result.total = recordset.RowCount;
                result.totalpage = recordset.PageCount;
                result.data = recordset.Results.ToList();
               
                result.success = true;
            }
            catch (Exception ex)
            {
                result.success = false;
                result.message = ex.Message;
            }
            return result;
        }
    }

}