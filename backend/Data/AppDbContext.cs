using AquaMap.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AquaMap.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<WaterPoint> WaterPoints => Set<WaterPoint>();
    public DbSet<PointInteraction> PointInteractions => Set<PointInteraction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.PhoneNumber).IsUnique();
            e.Property(u => u.Name).HasMaxLength(100).IsRequired();
            e.Property(u => u.PhoneNumber).HasMaxLength(20).IsRequired();
        });

        modelBuilder.Entity<WaterPoint>(e =>
        {
            e.HasKey(w => w.Id);
            e.Property(w => w.Description).HasMaxLength(500);
            e.Property(w => w.Address).HasMaxLength(300);
            e.Property(w => w.PhotoUrl).HasMaxLength(500);
            e.HasOne(w => w.CreatedBy)
                .WithMany(u => u.WaterPoints)
                .HasForeignKey(w => w.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PointInteraction>(e =>
        {
            e.HasKey(i => i.Id);
            e.HasOne(i => i.WaterPoint)
                .WithMany(w => w.Interactions)
                .HasForeignKey(i => i.WaterPointId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(i => i.User)
                .WithMany(u => u.Interactions)
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
