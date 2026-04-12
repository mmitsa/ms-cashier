namespace MsCashier.Domain.Interfaces;

using System.Linq.Expressions;
using MsCashier.Domain.Common;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(object id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate);
    Task<PagedResult<T>> GetPagedAsync(Expression<Func<T, bool>>? predicate, int page, int pageSize, Expression<Func<T, object>>? orderBy = null, bool descending = false);
    Task AddAsync(T entity);
    Task AddRangeAsync(IEnumerable<T> entities);
    void Update(T entity);
    void Remove(T entity);
    IQueryable<T> Query();
    /// <summary>
    /// Returns a queryable that IGNORES global query filters (tenant isolation).
    /// ONLY use this for SuperAdmin cross-tenant operations.
    /// </summary>
    IQueryable<T> QueryUnfiltered();
}
