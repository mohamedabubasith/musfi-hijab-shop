"""initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(150), unique=True, nullable=False),
        sa.Column("phone", sa.String(20)),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "refresh_tokens",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(255), unique=True, nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("revoked", sa.Boolean, server_default="false"),
    )

    op.create_table(
        "suppliers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("country", sa.String(50), nullable=False),
        sa.Column("contact", sa.String(100)),
        sa.Column("phone", sa.String(30)),
        sa.Column("email", sa.String(150)),
        sa.Column("notes", sa.Text),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "stock_items",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("name_ta", sa.String(150)),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("supplier_id", UUID(as_uuid=True), sa.ForeignKey("suppliers.id")),
        sa.Column("origin_country", sa.String(50), nullable=False),
        sa.Column("sku", sa.String(50), unique=True),
        sa.Column("cost_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("selling_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("quantity", sa.Integer, server_default="0"),
        sa.Column("low_stock_threshold", sa.Integer, server_default="5"),
        sa.Column("image_url", sa.String(500)),
        sa.Column("description", sa.Text),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "stock_movements",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("item_id", UUID(as_uuid=True), sa.ForeignKey("stock_items.id"), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("note", sa.Text),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "customers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(30)),
        sa.Column("email", sa.String(150)),
        sa.Column("address", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "sales",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("invoice_number", sa.String(50), unique=True, nullable=False),
        sa.Column("customer_id", UUID(as_uuid=True), sa.ForeignKey("customers.id")),
        sa.Column("customer_name", sa.String(100)),
        sa.Column("payment_method", sa.String(20), nullable=False),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
        sa.Column("discount", sa.Numeric(10, 2), server_default="0"),
        sa.Column("total", sa.Numeric(10, 2), nullable=False),
        sa.Column("cost_total", sa.Numeric(10, 2), nullable=False),
        sa.Column("profit", sa.Numeric(10, 2), nullable=False),
        sa.Column("is_delivery", sa.Boolean, server_default="false"),
        sa.Column("notes", sa.Text),
        sa.Column("sold_by", UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("sale_date", sa.Date, nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "sale_items",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("sale_id", UUID(as_uuid=True), sa.ForeignKey("sales.id", ondelete="CASCADE"), nullable=False),
        sa.Column("stock_item_id", UUID(as_uuid=True), sa.ForeignKey("stock_items.id"), nullable=False),
        sa.Column("item_name", sa.String(150), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("unit_cost", sa.Numeric(10, 2), nullable=False),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
    )

    op.create_table(
        "deliveries",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("sale_id", UUID(as_uuid=True), sa.ForeignKey("sales.id"), nullable=False),
        sa.Column("customer_name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(30)),
        sa.Column("address", sa.Text, nullable=False),
        sa.Column("status", sa.String(20), server_default="pending", nullable=False),
        sa.Column("assigned_to", UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("notes", sa.Text),
        sa.Column("expected_date", sa.Date),
        sa.Column("delivered_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_index("idx_sales_date", "sales", ["sale_date"])
    op.create_index("idx_sales_sold_by", "sales", ["sold_by"])
    op.create_index("idx_stock_category", "stock_items", ["category"])
    op.create_index("idx_stock_country", "stock_items", ["origin_country"])
    op.create_index("idx_deliveries_status", "deliveries", ["status"])
    op.create_index("idx_movements_item", "stock_movements", ["item_id"])


def downgrade() -> None:
    op.drop_table("deliveries")
    op.drop_table("sale_items")
    op.drop_table("sales")
    op.drop_table("customers")
    op.drop_table("stock_movements")
    op.drop_table("stock_items")
    op.drop_table("suppliers")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
