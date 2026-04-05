using MealPlanner.Application.Abstractions;
using MealPlanner.Domain.Inventory;
using Microsoft.EntityFrameworkCore;

namespace MealPlanner.Infrastructure.Persistence;

public sealed class MealPlannerDbContext(DbContextOptions<MealPlannerDbContext> options) : DbContext(options), IApplicationDbContext
{
    public DbSet<DefaultProduct> DefaultProducts => Set<DefaultProduct>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DefaultProduct>(builder =>
        {
            builder.ToTable("default_product");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasMaxLength(128).IsRequired();
            builder.Property(x => x.Name).HasMaxLength(256).IsRequired();
            builder.Property(x => x.DefaultShelfLifeDays).IsRequired();
            builder.Property(x => x.AmountPerPackage).HasPrecision(18, 3).IsRequired();
            builder.Property(x => x.Unit).HasConversion<string>().IsRequired();
            builder.Property(x => x.Version).IsRequired();
            builder.Property(x => x.IsCurrent).IsRequired();
            builder.Property(x => x.CreatedAtUtc).IsRequired();
            builder.Property(x => x.UpdatedAtUtc).IsRequired();
            builder.HasIndex(x => new { x.UserId, x.Name, x.IsCurrent });
            builder.HasIndex(x => new { x.UserId, x.Id });
        });

        modelBuilder.Entity<InventoryItem>(builder =>
        {
            builder.ToTable("inventory_item");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasMaxLength(128).IsRequired();
            builder.Property(x => x.IngredientName).HasMaxLength(256).IsRequired();
            builder.Property(x => x.RemainingAmountMetric).HasPrecision(18, 3).IsRequired();
            builder.Property(x => x.SnapshotAmountPerPackage).HasPrecision(18, 3).IsRequired();
            builder.Property(x => x.SnapshotUnit).HasConversion<string>().IsRequired();
            builder.Property(x => x.LocationCanonical).HasMaxLength(128).IsRequired();
            builder.Property(x => x.LocationDisplay).HasMaxLength(128).IsRequired();
            builder.Property(x => x.DateAdded).IsRequired();
            builder.Property(x => x.SellByDate).IsRequired();
            builder.Property(x => x.ConcurrencyToken).HasMaxLength(64).IsConcurrencyToken().IsRequired();
            builder.Property(x => x.CreatedAtUtc).IsRequired();
            builder.Property(x => x.UpdatedAtUtc).IsRequired();
            builder.HasIndex(x => new { x.UserId, x.LocationCanonical });
            builder.HasIndex(x => new { x.UserId, x.DefaultProductId });
            builder
                .HasOne<DefaultProduct>()
                .WithMany()
                .HasForeignKey(x => x.DefaultProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
