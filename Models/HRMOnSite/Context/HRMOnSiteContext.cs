using Microsoft.EntityFrameworkCore;

namespace POSApi.Models
{
    public partial class POSApiContext : DbContext
    {
        public POSApiContext(DbContextOptions<POSApiContext> options) : base(options) { }

       
        public DbSet<Side_Master> Side_Masters { get; set; }
      

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Side_Master>(entity =>
           {
               entity.ToTable(nameof(Side_Master));
               entity.HasKey(x => new { x.Side_Code });
           });
        }
    }
}