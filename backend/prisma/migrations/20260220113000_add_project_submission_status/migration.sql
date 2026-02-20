ALTER TABLE "Project"
ADD COLUMN "submission_status" VARCHAR(20) NOT NULL DEFAULT 'draft';

UPDATE "Project"
SET "submission_status" = CASE
  WHEN "workspace_stage" = 'submitted' THEN 'submitted'
  WHEN "workspace_stage" = 'in_review' THEN 'in_review'
  WHEN "workspace_stage" = 'approved' THEN 'approved'
  WHEN "workspace_stage" = 'rejected' THEN 'rejected'
  ELSE 'draft'
END;

ALTER TABLE "Project"
ADD CONSTRAINT "Project_submission_status_check"
CHECK ("submission_status" IN ('draft', 'submitted', 'in_review', 'approved', 'rejected'));

CREATE INDEX "Project_submission_status_idx" ON "Project"("submission_status");
