-- Change total_placed_order from INTEGER to DECIMAL(12,2)
-- to support monetary values from "Total Placed Order Value" column
ALTER TABLE klaviyo_flows
  ALTER COLUMN total_placed_order TYPE DECIMAL(12,2) USING total_placed_order::DECIMAL(12,2);
