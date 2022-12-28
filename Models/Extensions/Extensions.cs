using System;
using System.Linq;
using System.Threading.Tasks;

public static class Extensions
{
    public static PagedResult<T> GetPaged<T>(this IQueryable<T> query,
                                         int page, int pageSize) where T : class
    {
        var result = new PagedResult<T>();
        result.CurrentPage = page;
        result.PageSize = pageSize;
        result.RowCount = query.Count();

        var pageCount = (double)result.RowCount / pageSize;
        result.PageCount = (int)Math.Ceiling(pageCount);

        var skip = (page - 1) * pageSize;
        result.Results = query.Skip(skip).Take(pageSize).ToList();

        return result;
    }
    public static async Task<PagedResult<T>> AsyncGetPaged<T>(this IQueryable<T> query,
                                         int page, int pageSize) where T : class
    {
        var result = new PagedResult<T>();
        await Task.Run(() =>
        {
            result.CurrentPage = page;
            result.PageSize = pageSize;
            result.RowCount = query.Count();

            var pageCount = (double)result.RowCount / pageSize;
            result.PageCount = (int)Math.Ceiling(pageCount);

            var skip = (page - 1) * pageSize;
            result.Results = query.Skip(skip).Take(pageSize).ToList();
        });
        return result;
    }
}

public static class DateTimeExtensions
{
    public static DateTime StartOfWeek(this DateTime dt, DayOfWeek startOfWeek)
    {
        int diff = (7 + (dt.DayOfWeek - startOfWeek)) % 7;
        return dt.AddDays(-1 * diff).Date;
    }
    public static int MonthDifference(this DateTime lValue, DateTime rValue)
    {
        return Math.Abs((lValue.Month - rValue.Month) + 12 * (lValue.Year - rValue.Year));
    }
}