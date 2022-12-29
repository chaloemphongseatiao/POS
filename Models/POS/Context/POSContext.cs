using Microsoft.EntityFrameworkCore;

namespace POSApi.Models
{
    public partial class POSApiContext : DbContext
    {
        public POSApiContext(DbContextOptions<POSApiContext> options) : base(options) { }

        public virtual DbSet<Products> Products { get; set; }
        public virtual DbSet<Category> Categorys { get; set; }

          protected override void OnModelCreating(ModelBuilder modelBuilder)
            {

            modelBuilder.Entity<Products>(entity =>
            {
                entity.ToTable(nameof(Products));
                entity.HasKey(p => new { p.CompanyCode, p.ProductID });

            });

            modelBuilder.Entity<Category>(entity =>
            {
                entity.ToTable(nameof(Category));
                entity.HasKey(c => new { c.CompanyCode, c.CategoryID });
                
            });
            }
    }
}