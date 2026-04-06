using MealPlanner.Application.Abstractions;
using MealPlanner.Domain.Inventory;
using MealPlanner.Domain.Meals;
using Microsoft.EntityFrameworkCore;

namespace MealPlanner.Infrastructure.Persistence;

public sealed class MealPlannerDbContext(DbContextOptions<MealPlannerDbContext> options) : DbContext(options), IApplicationDbContext
{
    public DbSet<MeasurementType> MeasurementTypes => Set<MeasurementType>();
    public DbSet<DefaultProduct> DefaultProducts => Set<DefaultProduct>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<MealDefinition> MealDefinitions => Set<MealDefinition>();
    public DbSet<MealIngredientLine> MealIngredientLines => Set<MealIngredientLine>();
    public DbSet<UnknownIngredient> UnknownIngredients => Set<UnknownIngredient>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MeasurementType>(builder =>
        {
            builder.ToTable("measurement_type");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Id).ValueGeneratedNever();
            builder.Property(x => x.Code).HasMaxLength(16).IsRequired();
            builder.Property(x => x.Name).HasMaxLength(64).IsRequired();
            builder.HasIndex(x => x.Code).IsUnique();
            builder.HasData(
                new { Id = MeasurementTypeIds.Grams, Code = MeasurementTypeCodes.Grams, Name = "Grams" },
                new { Id = MeasurementTypeIds.Milliliters, Code = MeasurementTypeCodes.Milliliters, Name = "Milliliters" });
        });

        modelBuilder.Entity<DefaultProduct>(builder =>
        {
            builder.ToTable("default_product");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasMaxLength(128).IsRequired();
            builder.Property(x => x.Name).HasMaxLength(256).IsRequired();
            builder.Property(x => x.DefaultShelfLifeDays).IsRequired();
            builder.Property(x => x.AmountPerPackage).HasPrecision(18, 3).IsRequired();
            builder.Property(x => x.MeasurementTypeId).IsRequired();
            builder.Property(x => x.Version).IsRequired();
            builder.Property(x => x.IsCurrent).IsRequired();
            builder.Property(x => x.CreatedAtUtc).IsRequired();
            builder.Property(x => x.UpdatedAtUtc).IsRequired();
            builder.HasIndex(x => new { x.UserId, x.Name, x.IsCurrent });
            builder.HasIndex(x => new { x.UserId, x.Id });
            builder.HasOne<MeasurementType>()
                .WithMany()
                .HasForeignKey(x => x.MeasurementTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<InventoryItem>(builder =>
        {
            builder.ToTable("inventory_item");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasMaxLength(128).IsRequired();
            builder.Property(x => x.IngredientName).HasMaxLength(256).IsRequired();
            builder.Property(x => x.RemainingAmountMetric).HasPrecision(18, 3).IsRequired();
            builder.Property(x => x.SnapshotAmountPerPackage).HasPrecision(18, 3).IsRequired();
            builder.Property(x => x.SnapshotMeasurementTypeId).IsRequired();
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
            builder.HasOne<MeasurementType>()
                .WithMany()
                .HasForeignKey(x => x.SnapshotMeasurementTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MealDefinition>(builder =>
        {
            builder.ToTable("meal_definition");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasMaxLength(128).IsRequired();
            builder.Property(x => x.Name).HasMaxLength(256).IsRequired();
            builder.Property(x => x.CreatedAtUtc).IsRequired();
            builder.Property(x => x.UpdatedAtUtc).IsRequired();
            builder.HasIndex(x => new { x.UserId, x.Name });
            builder.HasMany(x => x.IngredientLines)
                .WithOne()
                .HasForeignKey(x => x.MealDefinitionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MealIngredientLine>(builder =>
        {
            builder.ToTable("meal_ingredient_line");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.MealDefinitionId).IsRequired();
            builder.Property(x => x.UserId).HasMaxLength(128).IsRequired();
            builder.Property(x => x.IngredientKind).HasConversion<string>().IsRequired();
            builder.Property(x => x.DefaultProductId).IsRequired(false);
            builder.Property(x => x.UnknownIngredientId).IsRequired(false);
            builder.Property(x => x.Amount).HasPrecision(18, 3).IsRequired();
            builder.Property(x => x.MeasurementTypeId).IsRequired();
            builder.Property(x => x.DisplayName).HasMaxLength(256).IsRequired();
            builder.Property(x => x.SortOrder).IsRequired();
            builder.Property(x => x.CreatedAtUtc).IsRequired();
            builder.Property(x => x.UpdatedAtUtc).IsRequired();
            builder.HasIndex(x => new { x.UserId, x.MealDefinitionId, x.SortOrder });
            builder.HasOne<DefaultProduct>()
                .WithMany()
                .HasForeignKey(x => x.DefaultProductId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.HasOne<UnknownIngredient>()
                .WithMany()
                .HasForeignKey(x => x.UnknownIngredientId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.HasOne<MeasurementType>()
                .WithMany()
                .HasForeignKey(x => x.MeasurementTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UnknownIngredient>(builder =>
        {
            builder.ToTable("unknown_ingredient");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasMaxLength(128).IsRequired();
            builder.Property(x => x.NormalizedName).HasMaxLength(256).IsRequired();
            builder.Property(x => x.DisplayName).HasMaxLength(256).IsRequired();
            builder.Property(x => x.MeasurementTypeId).IsRequired();
            builder.Property(x => x.Status).HasConversion<string>().IsRequired();
            builder.Property(x => x.ConvertedDefaultProductId).IsRequired(false);
            builder.Property(x => x.CreatedAtUtc).IsRequired();
            builder.Property(x => x.UpdatedAtUtc).IsRequired();
            builder.HasIndex(x => new { x.UserId, x.NormalizedName }).IsUnique();
            builder.HasIndex(x => new { x.UserId, x.Status });
            builder.HasOne<DefaultProduct>()
                .WithMany()
                .HasForeignKey(x => x.ConvertedDefaultProductId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.HasOne<MeasurementType>()
                .WithMany()
                .HasForeignKey(x => x.MeasurementTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
