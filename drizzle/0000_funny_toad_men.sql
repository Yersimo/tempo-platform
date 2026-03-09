CREATE TYPE "public"."accrual_period" AS ENUM('monthly', 'quarterly', 'annually');--> statement-breakpoint
CREATE TYPE "public"."app_assignment_status" AS ENUM('assigned', 'installed', 'pending', 'failed', 'removed');--> statement-breakpoint
CREATE TYPE "public"."app_category" AS ENUM('productivity', 'communication', 'security', 'development', 'design', 'finance', 'hr', 'custom');--> statement-breakpoint
CREATE TYPE "public"."app_component_type" AS ENUM('form', 'table', 'chart', 'text', 'image', 'button', 'container', 'list', 'detail', 'filter', 'tabs', 'modal');--> statement-breakpoint
CREATE TYPE "public"."app_data_source_type" AS ENUM('database', 'api', 'csv', 'google_sheets', 'airtable', 'manual');--> statement-breakpoint
CREATE TYPE "public"."app_license_type" AS ENUM('free', 'per_seat', 'enterprise', 'site');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('new', 'screening', 'phone_screen', 'technical', 'onsite', 'panel', 'assessment', 'reference_check', 'hiring_manager_review', 'offer', 'hired', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'login', 'logout', 'approve', 'reject');--> statement-breakpoint
CREATE TYPE "public"."benefit_type" AS ENUM('medical', 'dental', 'vision', 'retirement', 'life', 'disability', 'wellness', 'hsa', 'fsa', 'commuter', 'voluntary', 'other');--> statement-breakpoint
CREATE TYPE "public"."bg_check_provider" AS ENUM('checkr', 'goodhire', 'internal');--> statement-breakpoint
CREATE TYPE "public"."bg_check_result" AS ENUM('clear', 'review_needed', 'adverse');--> statement-breakpoint
CREATE TYPE "public"."bg_check_status" AS ENUM('pending', 'in_progress', 'completed', 'failed', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."bg_check_type" AS ENUM('criminal', 'employment', 'education', 'credit', 'reference', 'identity');--> statement-breakpoint
CREATE TYPE "public"."bill_pay_method" AS ENUM('ach', 'wire', 'check', 'virtual_card');--> statement-breakpoint
CREATE TYPE "public"."bill_pay_status" AS ENUM('draft', 'scheduled', 'processing', 'paid', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."block_progress_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."branching_action" AS ENUM('skip_to', 'hide', 'show', 'end_survey');--> statement-breakpoint
CREATE TYPE "public"."budget_status" AS ENUM('draft', 'active', 'closed');--> statement-breakpoint
CREATE TYPE "public"."buyback_status" AS ENUM('submitted', 'evaluating', 'quote_sent', 'accepted', 'rejected', 'completed');--> statement-breakpoint
CREATE TYPE "public"."candidate_scheduling_status" AS ENUM('slots_offered', 'candidate_selected', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."card_status" AS ENUM('active', 'frozen', 'cancelled', 'pending_activation', 'expired');--> statement-breakpoint
CREATE TYPE "public"."card_transaction_status" AS ENUM('pending', 'posted', 'declined', 'refunded', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."card_type" AS ENUM('physical', 'virtual');--> statement-breakpoint
CREATE TYPE "public"."carrier_sync_status" AS ENUM('connected', 'syncing', 'error', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."chat_channel_type" AS ENUM('direct', 'group', 'department', 'announcement', 'project', 'public');--> statement-breakpoint
CREATE TYPE "public"."chat_message_type" AS ENUM('text', 'file', 'system', 'announcement');--> statement-breakpoint
CREATE TYPE "public"."co_employment_status" AS ENUM('pending', 'active', 'terminated', 'transferred');--> statement-breakpoint
CREATE TYPE "public"."cobra_qualifying_event" AS ENUM('termination', 'hours_reduction', 'divorce', 'dependent_aging_out', 'death');--> statement-breakpoint
CREATE TYPE "public"."cobra_status" AS ENUM('pending_notification', 'notified', 'elected', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."compliance_alert_severity" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."compliance_alert_type" AS ENUM('upcoming_deadline', 'expiring_document', 'violation', 'reminder');--> statement-breakpoint
CREATE TYPE "public"."compliance_category" AS ENUM('labor_law', 'data_privacy', 'safety', 'financial', 'immigration', 'licensing');--> statement-breakpoint
CREATE TYPE "public"."compliance_doc_status" AS ENUM('valid', 'expired', 'pending_review');--> statement-breakpoint
CREATE TYPE "public"."compliance_frequency" AS ENUM('one_time', 'monthly', 'quarterly', 'annually');--> statement-breakpoint
CREATE TYPE "public"."compliance_status" AS ENUM('compliant', 'at_risk', 'non_compliant', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('video', 'document', 'slides', 'quiz', 'assignment', 'interactive');--> statement-breakpoint
CREATE TYPE "public"."cor_contractor_status" AS ENUM('onboarding', 'active', 'paused', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."cor_payment_frequency" AS ENUM('weekly', 'biweekly', 'monthly', 'milestone', 'on_completion');--> statement-breakpoint
CREATE TYPE "public"."course_format" AS ENUM('online', 'classroom', 'blended');--> statement-breakpoint
CREATE TYPE "public"."course_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."custom_app_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."custom_field_entity" AS ENUM('employee', 'department', 'job_posting', 'application');--> statement-breakpoint
CREATE TYPE "public"."custom_field_type" AS ENUM('text', 'number', 'date', 'boolean', 'select', 'multi_select', 'url', 'email', 'phone');--> statement-breakpoint
CREATE TYPE "public"."deployment_profile_status" AS ENUM('active', 'draft', 'archived');--> statement-breakpoint
CREATE TYPE "public"."device_action_status" AS ENUM('pending', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."device_action_type" AS ENUM('lock', 'wipe', 'restart', 'update_os', 'install_app', 'remove_app', 'push_config');--> statement-breakpoint
CREATE TYPE "public"."device_catalog_status" AS ENUM('available', 'out_of_stock', 'discontinued', 'coming_soon');--> statement-breakpoint
CREATE TYPE "public"."device_order_status" AS ENUM('pending_approval', 'approved', 'ordered', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."device_status" AS ENUM('available', 'assigned', 'maintenance', 'retired');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('laptop', 'desktop', 'phone', 'tablet', 'monitor', 'peripheral', 'other');--> statement-breakpoint
CREATE TYPE "public"."duplicate_status" AS ENUM('flagged', 'confirmed_duplicate', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."emergency_contact_relationship" AS ENUM('spouse', 'parent', 'sibling', 'child', 'friend', 'other');--> statement-breakpoint
CREATE TYPE "public"."employee_role" AS ENUM('owner', 'admin', 'hrbp', 'manager', 'employee');--> statement-breakpoint
CREATE TYPE "public"."enrollment_feed_status" AS ENUM('pending', 'sent', 'acknowledged', 'error', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('enrolled', 'in_progress', 'completed', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."eor_employee_status" AS ENUM('onboarding', 'active', 'on_leave', 'offboarding', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."eor_entity_status" AS ENUM('active', 'pending_setup', 'suspended', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."equity_grant_status" AS ENUM('active', 'fully_vested', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."equity_grant_type" AS ENUM('RSU', 'stock_option', 'phantom', 'SAR', 'ESPP');--> statement-breakpoint
CREATE TYPE "public"."everify_case_status" AS ENUM('open', 'initial_verification', 'employment_authorized', 'tentative_nonconfirmation', 'case_in_continuance', 'close_case_authorized', 'close_case_unauthorized', 'final_nonconfirmation');--> statement-breakpoint
CREATE TYPE "public"."everify_status" AS ENUM('not_submitted', 'pending', 'initial_case_created', 'employment_authorized', 'tentative_non_confirmation', 'case_closed', 'final_non_confirmation');--> statement-breakpoint
CREATE TYPE "public"."expense_status" AS ENUM('draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'reimbursed');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('recognition', 'feedback', 'checkin');--> statement-breakpoint
CREATE TYPE "public"."flex_account_status" AS ENUM('active', 'inactive', 'closed');--> statement-breakpoint
CREATE TYPE "public"."flex_account_type" AS ENUM('hsa', 'fsa_health', 'fsa_dependent', 'commuter_transit', 'commuter_parking');--> statement-breakpoint
CREATE TYPE "public"."flex_transaction_status" AS ENUM('pending', 'approved', 'denied');--> statement-breakpoint
CREATE TYPE "public"."flex_transaction_type" AS ENUM('contribution', 'expense', 'reimbursement', 'rollover');--> statement-breakpoint
CREATE TYPE "public"."form_1095_status" AS ENUM('pending', 'generated', 'filed', 'corrected');--> statement-breakpoint
CREATE TYPE "public"."geofence_event_type" AS ENUM('entry', 'exit', 'clock_in', 'clock_out', 'violation');--> statement-breakpoint
CREATE TYPE "public"."geofence_type" AS ENUM('office', 'warehouse', 'job_site', 'client_location', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."global_benefit_category" AS ENUM('health', 'retirement', 'life_insurance', 'disability', 'wellness', 'meal_allowance', 'transportation', 'housing', 'education', 'childcare', 'statutory');--> statement-breakpoint
CREATE TYPE "public"."goal_category" AS ENUM('business', 'project', 'development', 'compliance');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('not_started', 'on_track', 'at_risk', 'behind', 'completed');--> statement-breakpoint
CREATE TYPE "public"."headcount_budget_category" AS ENUM('base_salary', 'benefits', 'equity', 'signing_bonus', 'relocation', 'equipment');--> statement-breakpoint
CREATE TYPE "public"."headcount_plan_status" AS ENUM('draft', 'active', 'approved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."headcount_position_status" AS ENUM('planned', 'approved', 'open', 'filled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."headcount_position_type" AS ENUM('new', 'backfill', 'conversion');--> statement-breakpoint
CREATE TYPE "public"."headcount_priority" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."i9_document_category" AS ENUM('list_a', 'list_b', 'list_c');--> statement-breakpoint
CREATE TYPE "public"."i9_status" AS ENUM('not_started', 'section1_pending', 'section1_complete', 'section2_pending', 'section2_complete', 'everify_pending', 'everify_submitted', 'verified', 'tnc_issued', 'tnc_contested', 'final_nonconfirmation', 'closed', 'reverification_needed', 'complete', 'expired');--> statement-breakpoint
CREATE TYPE "public"."idp_app_status" AS ENUM('active', 'inactive', 'pending_setup');--> statement-breakpoint
CREATE TYPE "public"."idp_protocol" AS ENUM('saml', 'oidc', 'ldap', 'scim');--> statement-breakpoint
CREATE TYPE "public"."initiative_status" AS ENUM('proposed', 'approved', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('disconnected', 'connected', 'error', 'syncing');--> statement-breakpoint
CREATE TYPE "public"."interview_recording_status" AS ENUM('scheduled', 'recording', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."inventory_condition" AS ENUM('new', 'good', 'fair', 'poor');--> statement-breakpoint
CREATE TYPE "public"."inventory_status" AS ENUM('in_warehouse', 'assigned', 'in_transit', 'retired', 'lost');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."it_request_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."it_request_status" AS ENUM('open', 'in_progress', 'resolved', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."it_request_type" AS ENUM('hardware', 'software', 'access', 'support', 'other');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'open', 'closed', 'filled');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('full_time', 'part_time', 'contract', 'internship');--> statement-breakpoint
CREATE TYPE "public"."knockout_question_type" AS ENUM('yes_no', 'multiple_choice', 'numeric');--> statement-breakpoint
CREATE TYPE "public"."kpi_frequency" AS ENUM('daily', 'weekly', 'monthly', 'quarterly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."leave_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."leave_type" AS ENUM('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid', 'compassionate');--> statement-breakpoint
CREATE TYPE "public"."managed_device_platform" AS ENUM('macos', 'windows', 'ios', 'android', 'linux');--> statement-breakpoint
CREATE TYPE "public"."managed_device_status" AS ENUM('active', 'inactive', 'lost', 'retired', 'pending_setup');--> statement-breakpoint
CREATE TYPE "public"."mentoring_status" AS ENUM('draft', 'active', 'completed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."mentoring_type" AS ENUM('one_on_one', 'group', 'reverse', 'peer');--> statement-breakpoint
CREATE TYPE "public"."merit_cycle_status" AS ENUM('planning', 'budgeting', 'manager_allocation', 'review', 'approved', 'completed');--> statement-breakpoint
CREATE TYPE "public"."merit_cycle_type" AS ENUM('annual_merit', 'promotion', 'market_adjustment', 'bonus');--> statement-breakpoint
CREATE TYPE "public"."merit_recommendation_status" AS ENUM('pending', 'manager_approved', 'hr_approved', 'final_approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('sent', 'delivered', 'read');--> statement-breakpoint
CREATE TYPE "public"."mfa_method" AS ENUM('totp', 'sms', 'email');--> statement-breakpoint
CREATE TYPE "public"."mfa_policy_enforcement" AS ENUM('required', 'optional', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."mileage_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."mileage_trip_type" AS ENUM('round_trip', 'one_way');--> statement-breakpoint
CREATE TYPE "public"."mileage_vehicle_type" AS ENUM('personal', 'company');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('in_app', 'email', 'both');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('info', 'success', 'warning', 'action_required', 'mention', 'approval', 'reminder');--> statement-breakpoint
CREATE TYPE "public"."objective_status" AS ENUM('draft', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."offboarding_checklist_category" AS ENUM('access_revocation', 'device_return', 'knowledge_transfer', 'exit_interview', 'final_pay', 'benefits', 'documents');--> statement-breakpoint
CREATE TYPE "public"."offboarding_process_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."offboarding_reason" AS ENUM('resignation', 'termination', 'layoff', 'retirement', 'end_of_contract');--> statement-breakpoint
CREATE TYPE "public"."offboarding_task_status" AS ENUM('pending', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."open_enrollment_status" AS ENUM('upcoming', 'active', 'closed');--> statement-breakpoint
CREATE TYPE "public"."org_plan" AS ENUM('free', 'starter', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."pair_status" AS ENUM('pending', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payroll_status" AS ENUM('draft', 'approved', 'processing', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."peo_service" AS ENUM('payroll', 'benefits', 'workers_comp', 'hr_compliance', 'tax_filing', 'risk_management');--> statement-breakpoint
CREATE TYPE "public"."peo_service_type" AS ENUM('full_peo', 'aso', 'payroll_only', 'benefits_only', 'compliance_only');--> statement-breakpoint
CREATE TYPE "public"."peo_status" AS ENUM('active', 'inactive', 'pending', 'pending_setup', 'suspended', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."pip_checkin_frequency" AS ENUM('weekly', 'biweekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."pip_progress" AS ENUM('on_track', 'behind', 'at_risk', 'improved');--> statement-breakpoint
CREATE TYPE "public"."pip_status" AS ENUM('draft', 'active', 'extended', 'completed_success', 'completed_failure', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."platform_admin_role" AS ENUM('super_admin', 'support', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."policy_applies_to" AS ENUM('all', 'department', 'role', 'level');--> statement-breakpoint
CREATE TYPE "public"."policy_rule_action" AS ENUM('block', 'warn', 'require_approval');--> statement-breakpoint
CREATE TYPE "public"."procurement_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."procurement_request_status" AS ENUM('submitted', 'under_review', 'approved', 'rejected', 'fulfilled');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."purchase_order_status" AS ENUM('draft', 'pending_approval', 'approved', 'sent_to_vendor', 'partially_received', 'received', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."receipt_match_status" AS ENUM('matched', 'mismatch_amount', 'mismatch_vendor', 'mismatch_date', 'no_receipt', 'pending');--> statement-breakpoint
CREATE TYPE "public"."referral_bonus_trigger" AS ENUM('hire', '90_day_retention', '180_day_retention');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('submitted', 'reviewing', 'interviewing', 'hired', 'rejected', 'bonus_pending', 'bonus_paid');--> statement-breakpoint
CREATE TYPE "public"."reimbursement_batch_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."reimbursement_item_status" AS ENUM('pending', 'processed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."reimbursement_method" AS ENUM('payroll', 'direct_deposit', 'manual');--> statement-breakpoint
CREATE TYPE "public"."retirement_plan_status" AS ENUM('active', 'frozen', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."retirement_plan_type" AS ENUM('traditional_401k', 'roth_401k', 'safe_harbor_401k', '403b', '457b', 'simple_ira', 'sep_ira');--> statement-breakpoint
CREATE TYPE "public"."review_cycle_status" AS ENUM('draft', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."review_cycle_type" AS ENUM('annual', 'mid_year', 'quarterly', 'probation');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'in_progress', 'submitted', 'completed');--> statement-breakpoint
CREATE TYPE "public"."review_template_type" AS ENUM('annual', 'mid_year', 'quarterly', 'probation', '360', 'self', 'manager', 'peer');--> statement-breakpoint
CREATE TYPE "public"."review_type" AS ENUM('annual', 'mid_year', 'quarterly', 'probation', 'manager', 'peer', 'self');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."salary_review_status" AS ENUM('draft', 'pending_approval', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."sandbox_snapshot_status" AS ENUM('creating', 'ready', 'restoring', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sandbox_status" AS ENUM('provisioning', 'active', 'paused', 'expired', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."saved_query_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."security_policy_type" AS ENUM('password', 'encryption', 'firewall', 'screensaver', 'os_update', 'app_restriction');--> statement-breakpoint
CREATE TYPE "public"."sentiment" AS ENUM('positive', 'neutral', 'negative');--> statement-breakpoint
CREATE TYPE "public"."shift_status" AS ENUM('scheduled', 'completed', 'no_show', 'swapped');--> statement-breakpoint
CREATE TYPE "public"."signature_audit_action" AS ENUM('created', 'sent', 'viewed', 'signed', 'declined', 'voided', 'reminded', 'expired', 'downloaded');--> statement-breakpoint
CREATE TYPE "public"."signature_request_status" AS ENUM('draft', 'pending', 'partially_signed', 'completed', 'declined', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."signature_status" AS ENUM('draft', 'pending', 'in_progress', 'completed', 'declined', 'expired', 'voided');--> statement-breakpoint
CREATE TYPE "public"."signer_status" AS ENUM('pending', 'sent', 'viewed', 'signed', 'declined');--> statement-breakpoint
CREATE TYPE "public"."signing_flow" AS ENUM('sequential', 'parallel');--> statement-breakpoint
CREATE TYPE "public"."step_type" AS ENUM('action', 'condition', 'delay', 'notification', 'approval');--> statement-breakpoint
CREATE TYPE "public"."survey_frequency" AS ENUM('weekly', 'biweekly', 'monthly', 'quarterly', 'annually');--> statement-breakpoint
CREATE TYPE "public"."survey_question_type" AS ENUM('rating', 'text', 'multiple_choice', 'nps', 'matrix');--> statement-breakpoint
CREATE TYPE "public"."survey_status" AS ENUM('draft', 'active', 'closed');--> statement-breakpoint
CREATE TYPE "public"."survey_template_type" AS ENUM('pulse', 'enps', 'onboarding', 'exit', 'custom', 'annual', 'dei');--> statement-breakpoint
CREATE TYPE "public"."survey_trigger_event" AS ENUM('employee_hired', 'employee_terminated', 'review_completed', 'anniversary', 'promotion', 'transfer', 'return_from_leave');--> statement-breakpoint
CREATE TYPE "public"."survey_type" AS ENUM('pulse', 'enps', 'annual', 'custom');--> statement-breakpoint
CREATE TYPE "public"."sync_direction" AS ENUM('inbound', 'outbound', 'bidirectional');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'review', 'done');--> statement-breakpoint
CREATE TYPE "public"."time_entry_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."time_off_type" AS ENUM('annual', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'jury_duty', 'military');--> statement-breakpoint
CREATE TYPE "public"."travel_booking_status" AS ENUM('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."travel_booking_type" AS ENUM('flight', 'hotel', 'car_rental', 'train', 'other');--> statement-breakpoint
CREATE TYPE "public"."travel_request_status" AS ENUM('draft', 'pending_approval', 'approved', 'booked', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."trigger_type" AS ENUM('schedule', 'event', 'manual', 'webhook');--> statement-breakpoint
CREATE TYPE "public"."vault_item_type" AS ENUM('login', 'secure_note', 'credit_card', 'identity', 'ssh_key', 'api_key');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."vesting_schedule_type" AS ENUM('immediate', 'cliff', 'graded', 'custom');--> statement-breakpoint
CREATE TYPE "public"."video_screen_status" AS ENUM('draft', 'sent', 'in_progress', 'completed', 'expired', 'reviewed');--> statement-breakpoint
CREATE TYPE "public"."workflow_action_type" AS ENUM('send_email', 'send_slack', 'create_task', 'assign_app', 'revoke_app', 'assign_device', 'update_field', 'notify_manager', 'add_to_group', 'schedule_meeting', 'create_review', 'enroll_course', 'trigger_webhook');--> statement-breakpoint
CREATE TYPE "public"."workflow_run_status" AS ENUM('running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."workflow_run_step_status" AS ENUM('pending', 'running', 'completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."workflow_status" AS ENUM('draft', 'active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."workflow_step_type" AS ENUM('action', 'condition', 'delay', 'approval');--> statement-breakpoint
CREATE TYPE "public"."workflow_trigger" AS ENUM('employee_hired', 'employee_terminated', 'role_changed', 'department_changed', 'review_completed', 'leave_approved', 'expense_submitted', 'payroll_completed', 'custom');--> statement-breakpoint
CREATE TABLE "aca_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"measurement_period" varchar(100),
	"avg_weekly_hours" real,
	"is_fte" boolean DEFAULT false NOT NULL,
	"is_eligible" boolean DEFAULT false NOT NULL,
	"offered_coverage" boolean DEFAULT false NOT NULL,
	"enrolled_coverage" boolean DEFAULT false NOT NULL,
	"form_1095_status" "form_1095_status" DEFAULT 'pending' NOT NULL,
	"tax_year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "advanced_expense_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"rules" jsonb,
	"applies_to" "policy_applies_to" DEFAULT 'all' NOT NULL,
	"target_values" jsonb
);
--> statement-breakpoint
CREATE TABLE "app_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"status" "app_assignment_status" DEFAULT 'assigned' NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"installed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "app_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"vendor" varchar(255),
	"category" "app_category" NOT NULL,
	"icon" varchar(100),
	"platform" varchar(100),
	"version" varchar(50),
	"license_type" "app_license_type" DEFAULT 'free' NOT NULL,
	"license_cost" real DEFAULT 0,
	"license_count" integer DEFAULT 0,
	"assigned_count" integer DEFAULT 0,
	"is_required" boolean DEFAULT false NOT NULL,
	"auto_install" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"type" "app_component_type" NOT NULL,
	"label" varchar(255),
	"config" jsonb NOT NULL,
	"data_source_id" uuid,
	"position" jsonb,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"conditional_visibility" jsonb,
	"style" jsonb
);
--> statement-breakpoint
CREATE TABLE "app_data_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "app_data_source_type" NOT NULL,
	"config" jsonb NOT NULL,
	"schema" jsonb,
	"refresh_interval" integer,
	"last_refreshed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"layout" jsonb,
	"is_home_page" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"icon" varchar(50),
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"candidate_name" varchar(255) NOT NULL,
	"candidate_email" varchar(255) NOT NULL,
	"status" "application_status" DEFAULT 'new' NOT NULL,
	"stage" varchar(255),
	"rating" integer,
	"notes" text,
	"resume_url" text,
	"applied_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_chains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"min_amount" integer,
	"max_amount" integer,
	"approver_roles" jsonb,
	"approver_ids" jsonb,
	"required_approvals" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"chain_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"step_order" integer DEFAULT 1 NOT NULL,
	"approver_id" uuid NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"comments" text,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"course_content_id" uuid NOT NULL,
	"answers" jsonb,
	"score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"percentage" real NOT NULL,
	"passed" boolean NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid,
	"action" "audit_action" NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(255),
	"details" text,
	"ip_address" varchar(50),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_enroll_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"department_id" uuid,
	"role" varchar(100),
	"job_title" varchar(255),
	"course_ids" jsonb NOT NULL,
	"trigger_event" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_workflow_run_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"step_id" uuid NOT NULL,
	"status" "workflow_run_step_status" DEFAULT 'pending' NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "automation_workflow_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"triggered_by" varchar(255),
	"trigger_data" jsonb,
	"status" "workflow_run_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "automation_workflow_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"type" "workflow_step_type" NOT NULL,
	"config" jsonb,
	"next_step_on_true" uuid,
	"next_step_on_false" uuid
);
--> statement-breakpoint
CREATE TABLE "automation_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"trigger" "workflow_trigger" NOT NULL,
	"trigger_config" jsonb,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "background_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"application_id" uuid,
	"candidate_name" varchar(255) NOT NULL,
	"candidate_email" varchar(255) NOT NULL,
	"type" "bg_check_type" NOT NULL,
	"provider" "bg_check_provider" NOT NULL,
	"status" "bg_check_status" DEFAULT 'pending' NOT NULL,
	"result" "bg_check_result",
	"report_url" text,
	"requested_by" uuid,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "benefit_dependents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"relationship" varchar(50) NOT NULL,
	"date_of_birth" date,
	"gender" varchar(20),
	"plan_ids" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benefit_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"cancelled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "benefit_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "benefit_type" NOT NULL,
	"provider" varchar(255),
	"cost_employee" integer DEFAULT 0 NOT NULL,
	"cost_employer" integer DEFAULT 0 NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_pay_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"method" "bill_pay_method" DEFAULT 'ach' NOT NULL,
	"frequency" varchar(50) NOT NULL,
	"next_payment_date" date,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"invoice_id" uuid,
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"method" "bill_pay_method" DEFAULT 'ach' NOT NULL,
	"status" "bill_pay_status" DEFAULT 'draft' NOT NULL,
	"scheduled_date" date,
	"paid_date" date,
	"reference_number" varchar(255),
	"bank_account_last4" varchar(4),
	"routing_number" varchar(20),
	"check_number" varchar(50),
	"memo" text,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"department_id" uuid,
	"total_amount" integer NOT NULL,
	"spent_amount" integer DEFAULT 0 NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"fiscal_year" varchar(10) NOT NULL,
	"status" "budget_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyback_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"device_id" uuid,
	"employee_id" uuid NOT NULL,
	"device_name" varchar(255) NOT NULL,
	"condition" "inventory_condition" NOT NULL,
	"original_price" integer,
	"buyback_price" integer,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"status" "buyback_status" DEFAULT 'submitted' NOT NULL,
	"photos" jsonb,
	"employee_notes" text,
	"evaluation_notes" text,
	"evaluated_by" uuid,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_scheduling" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"application_id" uuid,
	"interview_type" varchar(100) NOT NULL,
	"available_slots" jsonb NOT NULL,
	"selected_slot" jsonb,
	"interviewer_ids" jsonb NOT NULL,
	"meeting_url" text,
	"status" "candidate_scheduling_status" DEFAULT 'slots_offered' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_spend_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"category" varchar(100),
	"daily_limit" integer,
	"weekly_limit" integer,
	"monthly_limit" integer,
	"per_transaction_limit" integer,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"merchant_name" varchar(255) NOT NULL,
	"merchant_category" varchar(100),
	"mcc" varchar(10),
	"status" "card_transaction_status" DEFAULT 'pending' NOT NULL,
	"receipt_url" text,
	"receipt_matched" boolean DEFAULT false NOT NULL,
	"expense_report_id" uuid,
	"cashback_amount" integer DEFAULT 0,
	"transacted_at" timestamp NOT NULL,
	"posted_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carrier_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"carrier_name" varchar(255) NOT NULL,
	"carrier_id" varchar(100),
	"plan_ids" jsonb,
	"connection_type" varchar(50) NOT NULL,
	"sync_status" "carrier_sync_status" DEFAULT 'disconnected' NOT NULL,
	"last_sync_at" timestamp,
	"last_sync_status" varchar(50),
	"config" jsonb,
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"enrollment_id" uuid,
	"certificate_number" varchar(100) NOT NULL,
	"certificate_url" text,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "chat_channel_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"is_muted" boolean DEFAULT false NOT NULL,
	"last_read_at" timestamp,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255),
	"type" "chat_channel_type" DEFAULT 'group' NOT NULL,
	"description" text,
	"created_by" uuid NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"last_message_at" timestamp,
	"department_id" uuid,
	"pinned_message_ids" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"type" "chat_message_type" DEFAULT 'text' NOT NULL,
	"content" text NOT NULL,
	"thread_id" uuid,
	"parent_message_id" uuid,
	"is_edited" boolean DEFAULT false NOT NULL,
	"edited_at" timestamp,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"pinned_at" timestamp,
	"pinned_by" uuid,
	"file_url" text,
	"file_name" varchar(255),
	"file_size" integer,
	"file_mime_type" varchar(100),
	"mentions" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"muted_until" timestamp,
	"last_read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "chat_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"emoji" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "co_employment_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"peo_config_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"enrolled_at" date NOT NULL,
	"terminated_at" date,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"workers_comp_code" varchar(50),
	"state_unemployment_id" varchar(100),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "cobra_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"qualifying_event" "cobra_qualifying_event" NOT NULL,
	"event_date" date NOT NULL,
	"election_deadline" date NOT NULL,
	"status" "cobra_status" DEFAULT 'pending_notification' NOT NULL,
	"coverage_plans" jsonb,
	"premium_amount" integer,
	"subsidy_percent" integer DEFAULT 0,
	"coverage_start_date" date,
	"coverage_end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comp_bands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"role_title" varchar(255) NOT NULL,
	"level" varchar(100),
	"country" varchar(100),
	"min_salary" integer NOT NULL,
	"mid_salary" integer NOT NULL,
	"max_salary" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"p25" integer,
	"p50" integer,
	"p75" integer,
	"effective_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"requirement_id" uuid,
	"type" "compliance_alert_type" NOT NULL,
	"severity" "compliance_alert_severity" NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"due_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requirement_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(500) NOT NULL,
	"file_url" text,
	"uploaded_by" uuid,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" date,
	"status" "compliance_doc_status" DEFAULT 'valid' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(500) NOT NULL,
	"category" "compliance_category" NOT NULL,
	"country" varchar(100),
	"description" text,
	"frequency" "compliance_frequency" NOT NULL,
	"due_date" date,
	"status" "compliance_status" DEFAULT 'compliant' NOT NULL,
	"assigned_to" uuid,
	"evidence" text,
	"last_checked" date,
	"next_due" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_block_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"block_id" uuid NOT NULL,
	"block_type" "content_type" NOT NULL,
	"status" "block_progress_status" DEFAULT 'not_started' NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"time_spent_minutes" integer DEFAULT 0 NOT NULL,
	"score" integer,
	"attempts" integer,
	"completed_at" timestamp,
	"last_accessed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"provider" varchar(50) DEFAULT 'internal' NOT NULL,
	"external_id" varchar(255),
	"category" varchar(100),
	"level" varchar(20),
	"duration_minutes" integer,
	"format" varchar(50),
	"thumbnail_url" text,
	"content_url" text,
	"rating" real,
	"enrollment_count" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false NOT NULL,
	"tags" jsonb,
	"language" varchar(50) DEFAULT 'English',
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contractor_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"contractor_name" varchar(255) NOT NULL,
	"company" varchar(255),
	"service_type" varchar(255),
	"invoice_number" varchar(100),
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"due_date" date,
	"paid_date" date,
	"payment_method" varchar(50),
	"tax_form" varchar(50),
	"country" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cor_contractors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"country" varchar(100) NOT NULL,
	"status" "cor_contractor_status" DEFAULT 'onboarding' NOT NULL,
	"job_title" varchar(255),
	"department" varchar(255),
	"rate" integer NOT NULL,
	"rate_type" varchar(20) NOT NULL,
	"currency" varchar(10) NOT NULL,
	"payment_frequency" "cor_payment_frequency" DEFAULT 'monthly' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"compliance_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"tax_classification" varchar(50),
	"tax_documents" jsonb,
	"misclassification_risk" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cor_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"contractor_id" uuid NOT NULL,
	"contract_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"document_url" text,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"scope_of_work" text,
	"deliverables" jsonb,
	"total_value" integer,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"start_date" date,
	"end_date" date,
	"signed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cor_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"contractor_id" uuid NOT NULL,
	"contract_id" uuid,
	"amount" integer NOT NULL,
	"currency" varchar(10) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"period_start" date,
	"period_end" date,
	"hours_worked" real,
	"invoice_url" text,
	"payment_method" varchar(50),
	"paid_at" timestamp,
	"approved_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"card_type" "card_type" DEFAULT 'virtual' NOT NULL,
	"last_4" varchar(4) NOT NULL,
	"card_name" varchar(255) NOT NULL,
	"status" "card_status" DEFAULT 'pending_activation' NOT NULL,
	"spend_limit" integer NOT NULL,
	"monthly_limit" integer,
	"current_balance" integer DEFAULT 0 NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"allowed_categories" jsonb,
	"expiry_month" integer,
	"expiry_year" integer,
	"cashback_rate" real DEFAULT 1.75,
	"total_cashback" integer DEFAULT 0 NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "country_benefit_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"country" varchar(100) NOT NULL,
	"country_code" varchar(5) NOT NULL,
	"mandatory_benefits" jsonb,
	"supplementary_benefits" jsonb,
	"tax_implications" jsonb,
	"compliance_notes" text,
	"last_reviewed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"type" "content_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"content_url" text,
	"duration_minutes" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"passing_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_prerequisites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"prerequisite_course_id" uuid NOT NULL,
	"type" varchar(20) DEFAULT 'required' NOT NULL,
	"minimum_score" integer
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"category" varchar(100),
	"duration_hours" integer,
	"format" "course_format" DEFAULT 'online' NOT NULL,
	"level" "course_level" DEFAULT 'beginner' NOT NULL,
	"is_mandatory" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currency_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"currency" varchar(10) NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"account_name" varchar(255),
	"bank_name" varchar(255),
	"bank_account_number" varchar(50),
	"iban" varchar(50),
	"swift_code" varchar(20),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"slug" varchar(100) NOT NULL,
	"status" "custom_app_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid NOT NULL,
	"published_by" uuid,
	"published_at" timestamp,
	"access_roles" jsonb,
	"theme" jsonb,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_field_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"field_type" "custom_field_type" NOT NULL,
	"entity_type" "custom_field_entity" NOT NULL,
	"description" text,
	"options" jsonb,
	"is_required" boolean DEFAULT false NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"group_name" varchar(255),
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_field_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_definition_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"value" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"parent_id" uuid,
	"head_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployment_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"platform" "managed_device_platform" NOT NULL,
	"status" "deployment_profile_status" DEFAULT 'draft' NOT NULL,
	"config" jsonb NOT NULL,
	"apps_to_install" jsonb,
	"security_policy_ids" jsonb,
	"welcome_message" text,
	"skip_setup_steps" jsonb,
	"is_default" boolean DEFAULT false NOT NULL,
	"device_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"action_type" "device_action_type" NOT NULL,
	"status" "device_action_status" DEFAULT 'pending' NOT NULL,
	"initiated_by" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "device_enrollment_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"token" varchar(500) NOT NULL,
	"assigned_to" uuid,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_at" timestamp,
	"device_id" uuid,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"platform" varchar(50),
	"serial_number" varchar(255),
	"status" "inventory_status" DEFAULT 'in_warehouse' NOT NULL,
	"condition" "inventory_condition" DEFAULT 'new' NOT NULL,
	"purchase_date" date,
	"purchase_cost" real,
	"warranty_expiry" date,
	"assigned_to" uuid,
	"warehouse_location" varchar(255),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "device_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"catalog_item_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"for_employee_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total_price" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"status" "device_order_status" DEFAULT 'pending_approval' NOT NULL,
	"shipping_address" text,
	"tracking_number" varchar(255),
	"approved_by" uuid,
	"approved_at" timestamp,
	"ordered_at" timestamp,
	"delivered_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_store_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"manufacturer" varchar(100) NOT NULL,
	"model" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"platform" varchar(50),
	"specs" jsonb,
	"price" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"image_url" text,
	"status" "device_catalog_status" DEFAULT 'available' NOT NULL,
	"stock_count" integer DEFAULT 0 NOT NULL,
	"supplier" varchar(255),
	"warranty_months" integer DEFAULT 12,
	"is_approved" boolean DEFAULT true NOT NULL,
	"allowed_roles" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"type" "device_type" NOT NULL,
	"brand" varchar(100),
	"model" varchar(255),
	"serial_number" varchar(255),
	"status" "device_status" DEFAULT 'available' NOT NULL,
	"assigned_to" uuid,
	"purchase_date" date,
	"warranty_end" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duplicate_detection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"expense_item_id" uuid,
	"duplicate_of_id" uuid,
	"similarity" real,
	"fields" jsonb,
	"status" "duplicate_status" DEFAULT 'flagged' NOT NULL,
	"reviewed_by" uuid
);
--> statement-breakpoint
CREATE TABLE "dynamic_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(20) DEFAULT 'dynamic' NOT NULL,
	"rule" jsonb,
	"member_count" integer DEFAULT 0,
	"created_by" uuid,
	"last_synced_at" timestamp,
	"modules" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"relationship" "emergency_contact_relationship" NOT NULL,
	"phone" varchar(50) NOT NULL,
	"email" varchar(255),
	"address" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_payroll_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"gross_pay" integer NOT NULL,
	"base_pay" integer NOT NULL,
	"overtime_pay" integer DEFAULT 0 NOT NULL,
	"overtime_hours" real DEFAULT 0,
	"overtime_rate" real DEFAULT 1.5,
	"bonus_pay" integer DEFAULT 0 NOT NULL,
	"bonus_details" jsonb,
	"federal_tax" integer NOT NULL,
	"state_tax" integer DEFAULT 0 NOT NULL,
	"social_security" integer DEFAULT 0 NOT NULL,
	"medicare" integer DEFAULT 0 NOT NULL,
	"pension" integer DEFAULT 0 NOT NULL,
	"additional_taxes" jsonb,
	"garnishments" jsonb,
	"garnishment_total" integer DEFAULT 0 NOT NULL,
	"benefit_deductions" integer DEFAULT 0 NOT NULL,
	"total_deductions" integer NOT NULL,
	"net_pay" integer NOT NULL,
	"currency" varchar(10) NOT NULL,
	"country" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"department_id" uuid,
	"full_name" varchar(255) NOT NULL,
	"first_name" varchar(128),
	"last_name" varchar(128),
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"avatar_url" text,
	"job_title" varchar(255),
	"level" varchar(100),
	"country" varchar(100),
	"role" "employee_role" DEFAULT 'employee' NOT NULL,
	"manager_id" uuid,
	"hire_date" date,
	"password_hash" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"invited_by" uuid,
	"invitation_token" varchar(500),
	"invitation_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engagement_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"department_id" uuid,
	"country_id" varchar(100),
	"period" varchar(50) NOT NULL,
	"overall_score" integer NOT NULL,
	"enps_score" integer,
	"response_rate" integer,
	"themes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollment_feeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"carrier_id" uuid NOT NULL,
	"feed_type" varchar(50) NOT NULL,
	"status" "enrollment_feed_status" DEFAULT 'pending' NOT NULL,
	"record_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0,
	"errors" jsonb,
	"file_url" text,
	"sent_at" timestamp,
	"acknowledged_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"status" "enrollment_status" DEFAULT 'enrolled' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "eor_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"eor_employee_id" uuid NOT NULL,
	"contract_type" varchar(50) NOT NULL,
	"document_url" text,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"effective_date" date,
	"expiration_date" date,
	"terms" jsonb,
	"signed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eor_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"eor_entity_id" uuid NOT NULL,
	"employee_id" uuid,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"job_title" varchar(255),
	"department" varchar(255),
	"status" "eor_employee_status" DEFAULT 'onboarding' NOT NULL,
	"salary" integer NOT NULL,
	"currency" varchar(10) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"contract_type" varchar(50) DEFAULT 'full_time' NOT NULL,
	"local_benefits" jsonb,
	"tax_setup" jsonb,
	"visa_required" boolean DEFAULT false,
	"visa_status" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eor_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"country" varchar(100) NOT NULL,
	"country_code" varchar(5) NOT NULL,
	"legal_entity_name" varchar(500) NOT NULL,
	"partner_name" varchar(255) NOT NULL,
	"status" "eor_entity_status" DEFAULT 'pending_setup' NOT NULL,
	"currency" varchar(10) NOT NULL,
	"tax_id" varchar(100),
	"registration_number" varchar(100),
	"address" text,
	"monthly_fee" integer,
	"setup_fee" integer,
	"employee_count" integer DEFAULT 0 NOT NULL,
	"contract_start_date" date,
	"contract_end_date" date,
	"benefits" jsonb,
	"compliance_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equity_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid,
	"grant_type" "equity_grant_type" DEFAULT 'RSU' NOT NULL,
	"shares" integer DEFAULT 0 NOT NULL,
	"strike_price" real DEFAULT 0,
	"vesting_schedule" varchar(255),
	"vested_shares" integer DEFAULT 0,
	"current_value" integer DEFAULT 0,
	"grant_date" date,
	"status" "equity_grant_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "everify_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"i9_form_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"case_number" varchar(100),
	"status" "everify_case_status" DEFAULT 'open' NOT NULL,
	"submitted_at" timestamp,
	"submitted_by" uuid,
	"resolved_at" timestamp,
	"verification_result" varchar(100),
	"tnc_issue_date" date,
	"tnc_referral_date" date,
	"tnc_contest_deadline" date,
	"employee_contesting" boolean DEFAULT false NOT NULL,
	"closed_at" timestamp,
	"closure_reason" text,
	"photo_match_result" varchar(50),
	"response_details" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exit_surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"process_id" uuid,
	"employee_id" uuid NOT NULL,
	"responses" jsonb,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text,
	"amount" integer NOT NULL,
	"receipt_url" text,
	"ocr_data" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "expense_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"max_amount" integer,
	"max_daily_amount" integer,
	"requires_receipt" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"auto_approve_below" integer,
	"allowed_roles" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"total_amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"status" "expense_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"approved_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"from_id" uuid NOT NULL,
	"to_id" uuid NOT NULL,
	"type" "feedback_type" NOT NULL,
	"content" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"storage_provider" varchar(50) DEFAULT 'local' NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"is_public" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "flex_benefit_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"type" "flex_account_type" NOT NULL,
	"plan_year" varchar(10) NOT NULL,
	"employee_contribution" integer DEFAULT 0 NOT NULL,
	"employer_contribution" integer DEFAULT 0 NOT NULL,
	"current_balance" integer DEFAULT 0 NOT NULL,
	"ytd_expenses" integer DEFAULT 0 NOT NULL,
	"max_contribution" integer NOT NULL,
	"rollover_amount" integer DEFAULT 0,
	"status" "flex_account_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flex_benefit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"type" "flex_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"description" text,
	"date" date NOT NULL,
	"receipt_url" text,
	"status" "flex_transaction_status" DEFAULT 'pending' NOT NULL,
	"category" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "fx_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"from_currency" varchar(10) NOT NULL,
	"to_currency" varchar(10) NOT NULL,
	"from_amount" integer NOT NULL,
	"to_amount" integer NOT NULL,
	"exchange_rate" real NOT NULL,
	"fee" integer DEFAULT 0,
	"purpose" varchar(255),
	"reference" varchar(255),
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geofence_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"event_type" "geofence_event_type" NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"accuracy" real,
	"distance_from_center" real,
	"is_within_zone" boolean NOT NULL,
	"device_info" jsonb,
	"time_entry_id" uuid,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geofence_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "geofence_type" DEFAULT 'office' NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"radius_meters" integer NOT NULL,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"require_clock_in_within" boolean DEFAULT false NOT NULL,
	"alert_on_violation" boolean DEFAULT true NOT NULL,
	"assigned_departments" jsonb,
	"assigned_employees" jsonb,
	"operating_hours" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_benefit_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"country" varchar(100) NOT NULL,
	"coverage_level" varchar(50) DEFAULT 'employee_only',
	"dependent_count" integer DEFAULT 0,
	"employee_contribution" integer DEFAULT 0,
	"employer_contribution" integer DEFAULT 0,
	"currency" varchar(10) NOT NULL,
	"enrolled_at" date NOT NULL,
	"terminated_at" date
);
--> statement-breakpoint
CREATE TABLE "global_benefit_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" "global_benefit_category" NOT NULL,
	"country" varchar(100) NOT NULL,
	"country_code" varchar(5) NOT NULL,
	"provider" varchar(255),
	"description" text,
	"is_statutory" boolean DEFAULT false NOT NULL,
	"statutory_reference" text,
	"cost_employee" integer DEFAULT 0,
	"cost_employer" integer DEFAULT 0,
	"currency" varchar(10) NOT NULL,
	"coverage_details" jsonb,
	"eligibility_criteria" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"category" "goal_category" DEFAULT 'business' NOT NULL,
	"status" "goal_status" DEFAULT 'not_started' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"start_date" date,
	"due_date" date,
	"parent_goal_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "headcount_budget_items" (
	"id" text PRIMARY KEY NOT NULL,
	"position_id" text NOT NULL,
	"category" "headcount_budget_category" NOT NULL,
	"amount" real DEFAULT 0 NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "headcount_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"fiscal_year" varchar(10) NOT NULL,
	"status" "headcount_plan_status" DEFAULT 'draft' NOT NULL,
	"total_budget" real DEFAULT 0 NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"created_by" text,
	"approved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "headcount_positions" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"org_id" text NOT NULL,
	"department_id" text NOT NULL,
	"job_title" varchar(255) NOT NULL,
	"level" varchar(50),
	"type" "headcount_position_type" DEFAULT 'new' NOT NULL,
	"status" "headcount_position_status" DEFAULT 'planned' NOT NULL,
	"priority" "headcount_priority" DEFAULT 'medium' NOT NULL,
	"salary_min" real DEFAULT 0,
	"salary_max" real DEFAULT 0,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"target_start_date" date,
	"filled_by" text,
	"filled_at" timestamp,
	"justification" text,
	"approved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "i9_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"i9_form_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"category" "i9_document_category" NOT NULL,
	"document_title" varchar(255) NOT NULL,
	"document_number" varchar(255),
	"issuing_authority" varchar(255),
	"expiration_date" date,
	"file_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "i9_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"status" "i9_status" DEFAULT 'not_started' NOT NULL,
	"hire_date" date NOT NULL,
	"start_date" date,
	"section1_completed_at" timestamp,
	"section2_completed_at" timestamp,
	"section1_data" jsonb,
	"section2_data" jsonb,
	"verified_by" uuid,
	"reverification_date" date,
	"reverification_doc_type" varchar(255),
	"reverification_doc_number" varchar(255),
	"reverification_expiration_date" date,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idp_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"default_protocol" "idp_protocol" DEFAULT 'saml' NOT NULL,
	"entity_id" varchar(500) NOT NULL,
	"sso_url" varchar(500) NOT NULL,
	"slo_url" varchar(500),
	"certificate" text NOT NULL,
	"private_key" text,
	"metadata_url" varchar(500),
	"session_timeout" integer DEFAULT 480,
	"force_reauth" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "impersonation_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"target_employee_id" text NOT NULL,
	"target_org_id" text NOT NULL,
	"reason" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "initiatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"objective_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "initiative_status" DEFAULT 'proposed' NOT NULL,
	"owner_id" uuid,
	"start_date" date,
	"end_date" date,
	"progress" integer DEFAULT 0 NOT NULL,
	"budget" integer,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integration_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"records_processed" integer DEFAULT 0,
	"records_failed" integer DEFAULT 0,
	"details" text,
	"error_message" text,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"status" "integration_status" DEFAULT 'disconnected' NOT NULL,
	"config" jsonb,
	"credentials" jsonb,
	"sync_direction" "sync_direction" DEFAULT 'inbound' NOT NULL,
	"last_sync_at" timestamp,
	"last_sync_status" varchar(50),
	"last_sync_details" text,
	"sync_frequency_minutes" integer DEFAULT 60,
	"mappings" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_recordings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"interview_type" varchar(100) NOT NULL,
	"interviewer_ids" jsonb NOT NULL,
	"status" "interview_recording_status" DEFAULT 'scheduled' NOT NULL,
	"recording_url" text,
	"duration" integer,
	"scheduled_at" timestamp,
	"recorded_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_transcriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recording_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"full_text" text,
	"segments" jsonb,
	"summary" text,
	"key_topics" jsonb,
	"sentiment" jsonb,
	"ai_scorecard" jsonb,
	"language" varchar(20) DEFAULT 'en' NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"vendor_id" uuid,
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"due_date" date,
	"issued_date" date,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "it_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"type" "it_request_type" NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"priority" "it_request_priority" DEFAULT 'medium' NOT NULL,
	"status" "it_request_status" DEFAULT 'open' NOT NULL,
	"assigned_to" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "job_postings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"department_id" uuid,
	"location" varchar(255),
	"type" "job_type" DEFAULT 'full_time' NOT NULL,
	"description" text,
	"requirements" text,
	"salary_min" integer,
	"salary_max" integer,
	"currency" varchar(10) DEFAULT 'USD',
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"application_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "key_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"objective_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"target_value" real NOT NULL,
	"current_value" real DEFAULT 0 NOT NULL,
	"unit" varchar(50),
	"owner_id" uuid,
	"due_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knockout_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"question" text NOT NULL,
	"type" "knockout_question_type" NOT NULL,
	"options" jsonb,
	"correct_answer" text NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"eliminate_on_wrong" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"unit" varchar(50),
	"target_value" real,
	"frequency" "kpi_frequency" DEFAULT 'monthly' NOT NULL,
	"department_id" uuid,
	"owner_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kpi_id" uuid NOT NULL,
	"value" real NOT NULL,
	"period" varchar(50) NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "learner_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"badge_type" varchar(50) NOT NULL,
	"badge_name" varchar(255) NOT NULL,
	"badge_icon" varchar(50),
	"description" text,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	"course_id" uuid,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "learner_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"source" varchar(50) NOT NULL,
	"description" text,
	"earned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"course_ids" jsonb NOT NULL,
	"target_roles" jsonb,
	"estimated_hours" real,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"type" "leave_type" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"days" integer NOT NULL,
	"status" "leave_status" DEFAULT 'pending' NOT NULL,
	"reason" text,
	"approved_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "life_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"event_date" date NOT NULL,
	"reported_date" date,
	"deadline" date,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"benefit_changes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "managed_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"platform" "managed_device_platform" NOT NULL,
	"manufacturer" varchar(100),
	"model" varchar(255),
	"serial_number" varchar(255),
	"os_version" varchar(100),
	"last_seen" timestamp,
	"status" "managed_device_status" DEFAULT 'active' NOT NULL,
	"is_encrypted" boolean DEFAULT false NOT NULL,
	"is_compliant" boolean DEFAULT true NOT NULL,
	"storage_capacity_gb" integer,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"mdm_profile_installed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentoring_pairs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"mentor_id" uuid NOT NULL,
	"mentee_id" uuid NOT NULL,
	"status" "pair_status" DEFAULT 'pending' NOT NULL,
	"match_score" integer,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mentoring_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"type" "mentoring_type" NOT NULL,
	"status" "mentoring_status" DEFAULT 'draft' NOT NULL,
	"duration_months" integer,
	"start_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merit_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "merit_cycle_type" NOT NULL,
	"status" "merit_cycle_status" DEFAULT 'planning' NOT NULL,
	"fiscal_year" varchar(10) NOT NULL,
	"total_budget" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"guidelines_config" jsonb,
	"start_date" date,
	"end_date" date,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merit_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"manager_id" uuid,
	"current_salary" integer NOT NULL,
	"proposed_salary" integer NOT NULL,
	"increase_percent" real NOT NULL,
	"increase_amount" integer NOT NULL,
	"rating" integer,
	"justification" text,
	"status" "merit_recommendation_status" DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mfa_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"user_id" uuid,
	"method" "mfa_method" DEFAULT 'totp' NOT NULL,
	"secret" varchar(255) NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"backup_codes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mfa_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"enforcement" "mfa_policy_enforcement" DEFAULT 'required' NOT NULL,
	"allowed_methods" jsonb NOT NULL,
	"grace_period_hours" integer DEFAULT 0,
	"remember_device_days" integer DEFAULT 30,
	"applies_to" "policy_applies_to" DEFAULT 'all' NOT NULL,
	"target_value" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mileage_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"date" date NOT NULL,
	"start_location" varchar(255) NOT NULL,
	"end_location" varchar(255) NOT NULL,
	"distance_miles" real NOT NULL,
	"rate" real NOT NULL,
	"amount" real NOT NULL,
	"purpose" text,
	"vehicle_type" "mileage_vehicle_type" DEFAULT 'personal' NOT NULL,
	"trip_type" "mileage_trip_type" DEFAULT 'one_way' NOT NULL,
	"status" "mileage_status" DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"due_date" date,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"in_app" boolean DEFAULT true NOT NULL,
	"email" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"sender_id" uuid,
	"type" "notification_type" DEFAULT 'info' NOT NULL,
	"channel" "notification_channel" DEFAULT 'in_app' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"link" varchar(500),
	"entity_type" varchar(50),
	"entity_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"email_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offboarding_checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checklist_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"category" "offboarding_checklist_category" NOT NULL,
	"assignee_role" varchar(100),
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offboarding_checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offboarding_processes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"initiated_by" uuid,
	"status" "offboarding_process_status" DEFAULT 'pending' NOT NULL,
	"checklist_id" uuid,
	"last_working_date" date,
	"reason" "offboarding_reason" NOT NULL,
	"notes" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "offboarding_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid NOT NULL,
	"checklist_item_id" uuid,
	"assignee_id" uuid,
	"status" "offboarding_task_status" DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"completed_by" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "open_ended_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"survey_response_id" varchar(100),
	"question_id" varchar(100),
	"text" text NOT NULL,
	"sentiment" "sentiment",
	"analyzed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "open_enrollment_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"effective_date" date NOT NULL,
	"status" "open_enrollment_status" DEFAULT 'upcoming' NOT NULL,
	"plan_ids" jsonb,
	"reminders_sent" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"logo_url" text,
	"plan" "org_plan" DEFAULT 'free' NOT NULL,
	"industry" varchar(255),
	"size" varchar(50),
	"country" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"stripe_customer_id" varchar(255),
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"enabled_modules" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "overtime_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"country" varchar(100) NOT NULL,
	"daily_threshold_hours" real DEFAULT 8 NOT NULL,
	"weekly_threshold_hours" real DEFAULT 40 NOT NULL,
	"multiplier" real DEFAULT 1.5 NOT NULL,
	"double_overtime_threshold" real,
	"double_overtime_multiplier" real,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_vaults" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_shared" boolean DEFAULT false NOT NULL,
	"owner_id" uuid NOT NULL,
	"shared_with" jsonb,
	"encryption_key_id" varchar(255),
	"item_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"period" varchar(100) NOT NULL,
	"status" "payroll_status" DEFAULT 'draft' NOT NULL,
	"total_gross" integer NOT NULL,
	"total_net" integer NOT NULL,
	"total_deductions" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"employee_count" integer NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"payment_reference" varchar(255),
	"cancellation_reason" text,
	"run_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"frequency" varchar(50) NOT NULL,
	"next_run_date" date,
	"employee_group" varchar(255),
	"auto_approve" boolean DEFAULT false NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"last_run_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peo_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"peo_provider_name" varchar(255) NOT NULL,
	"status" "peo_status" DEFAULT 'pending' NOT NULL,
	"service_type" "peo_service_type" DEFAULT 'full_peo' NOT NULL,
	"contract_start_date" date NOT NULL,
	"contract_end_date" date,
	"fein" varchar(20),
	"state_registrations" jsonb,
	"services" jsonb,
	"admin_fee_structure" jsonb,
	"workers_comp_policy" jsonb,
	"payroll_schedule" varchar(50),
	"primary_contact_name" varchar(255),
	"primary_contact_email" varchar(255),
	"primary_contact_phone" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peo_employee_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"peo_config_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"status" "co_employment_status" DEFAULT 'pending' NOT NULL,
	"work_state" varchar(50),
	"work_country" varchar(100) DEFAULT 'US' NOT NULL,
	"workers_comp_code" varchar(20),
	"workers_comp_description" varchar(255),
	"enrolled_at" timestamp,
	"terminated_at" timestamp,
	"termination_reason" text,
	"peo_employee_id" varchar(100),
	"sync_status" varchar(50) DEFAULT 'pending',
	"last_sync_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peo_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"peo_config_id" uuid NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"period" varchar(50) NOT NULL,
	"admin_fees" real NOT NULL,
	"workers_comp_premium" real DEFAULT 0 NOT NULL,
	"benefits_cost" real DEFAULT 0 NOT NULL,
	"payroll_taxes" real DEFAULT 0 NOT NULL,
	"total_amount" real NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"due_date" date,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peo_workers_comp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"peo_config_id" uuid NOT NULL,
	"class_code" varchar(20) NOT NULL,
	"description" varchar(500) NOT NULL,
	"state" varchar(50) NOT NULL,
	"rate" real NOT NULL,
	"effective_date" date,
	"expiration_date" date,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_improvement_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"reason" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "pip_status" DEFAULT 'draft' NOT NULL,
	"objectives" jsonb,
	"support_provided" text,
	"checkin_frequency" "pip_checkin_frequency" DEFAULT 'weekly' NOT NULL,
	"next_checkin" date,
	"outcome" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pip_check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pip_id" uuid NOT NULL,
	"date" date NOT NULL,
	"conducted_by" uuid NOT NULL,
	"progress" "pip_progress" NOT NULL,
	"notes" text,
	"objectives_status" jsonb,
	"next_steps" text
);
--> statement-breakpoint
CREATE TABLE "platform_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"password_hash" text,
	"role" "platform_admin_role" DEFAULT 'viewer' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "procurement_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"estimated_amount" integer,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"priority" "procurement_priority" DEFAULT 'medium' NOT NULL,
	"status" "procurement_request_status" DEFAULT 'submitted' NOT NULL,
	"department_id" uuid,
	"purchase_order_id" uuid,
	"needed_by" date,
	"approved_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "project_status" DEFAULT 'planning' NOT NULL,
	"owner_id" uuid,
	"start_date" date,
	"end_date" date,
	"budget" integer,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_id" uuid NOT NULL,
	"description" varchar(500) NOT NULL,
	"sku" varchar(100),
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"received_quantity" integer DEFAULT 0 NOT NULL,
	"category" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"po_number" varchar(50) NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" "purchase_order_status" DEFAULT 'draft' NOT NULL,
	"total_amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"shipping_address" text,
	"billing_address" text,
	"terms" text,
	"delivery_date" date,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_by" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "query_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"query_id" uuid NOT NULL,
	"frequency" varchar(50) NOT NULL,
	"recipients" jsonb,
	"format" varchar(20) DEFAULT 'csv' NOT NULL,
	"next_run_at" timestamp,
	"last_run_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_content_id" uuid NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_answer" varchar(255) NOT NULL,
	"explanation" text,
	"points" integer DEFAULT 1 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipt_matching" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"expense_item_id" uuid,
	"receipt_url" text,
	"extracted_amount" real,
	"extracted_currency" varchar(10),
	"extracted_vendor" varchar(255),
	"extracted_date" date,
	"match_status" "receipt_match_status" DEFAULT 'pending' NOT NULL,
	"confidence" real,
	"discrepancy_notes" text
);
--> statement-breakpoint
CREATE TABLE "referral_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"bonus_amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"bonus_trigger" "referral_bonus_trigger" NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"referrer_id" uuid NOT NULL,
	"candidate_name" varchar(255) NOT NULL,
	"candidate_email" varchar(255) NOT NULL,
	"job_id" uuid,
	"status" "referral_status" DEFAULT 'submitted' NOT NULL,
	"bonus_amount" integer,
	"bonus_paid_at" timestamp,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "reimbursement_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"status" "reimbursement_batch_status" DEFAULT 'pending' NOT NULL,
	"method" "reimbursement_method" DEFAULT 'payroll' NOT NULL,
	"total_amount" real NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"employee_count" integer NOT NULL,
	"processed_at" timestamp,
	"payroll_run_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reimbursement_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"expense_report_id" uuid,
	"employee_id" uuid NOT NULL,
	"amount" real NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"status" "reimbursement_item_status" DEFAULT 'pending' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "retirement_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"payroll_run_id" uuid,
	"employee_amount" integer NOT NULL,
	"employer_amount" integer NOT NULL,
	"employee_percent" real NOT NULL,
	"is_pre_tax" boolean DEFAULT true NOT NULL,
	"ytd_employee_total" integer DEFAULT 0 NOT NULL,
	"ytd_employer_total" integer DEFAULT 0 NOT NULL,
	"vesting_percent" real DEFAULT 0 NOT NULL,
	"period" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retirement_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"contribution_percent" real NOT NULL,
	"is_roth" boolean DEFAULT false NOT NULL,
	"enrolled_at" date NOT NULL,
	"terminated_at" date,
	"beneficiaries" jsonb,
	"investment_elections" jsonb
);
--> statement-breakpoint
CREATE TABLE "retirement_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "retirement_plan_type" NOT NULL,
	"status" "retirement_plan_status" DEFAULT 'active' NOT NULL,
	"provider" varchar(255) NOT NULL,
	"plan_number" varchar(100),
	"employee_contribution_limit" integer NOT NULL,
	"catch_up_contribution_limit" integer,
	"employer_match_percent" real DEFAULT 0,
	"employer_match_cap" real DEFAULT 0,
	"vesting_type" "vesting_schedule_type" DEFAULT 'graded' NOT NULL,
	"vesting_schedule" jsonb,
	"auto_enroll" boolean DEFAULT false NOT NULL,
	"auto_enroll_percent" real,
	"auto_escalate" boolean DEFAULT false NOT NULL,
	"escalation_percent" real,
	"escalation_cap" real,
	"effective_date" date,
	"termination_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" "review_cycle_type" NOT NULL,
	"status" "review_cycle_status" DEFAULT 'draft' NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "review_template_type" NOT NULL,
	"sections" jsonb,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"cycle_id" uuid,
	"employee_id" uuid NOT NULL,
	"reviewer_id" uuid,
	"type" "review_type" NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"overall_rating" integer,
	"ratings" jsonb,
	"comments" text,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"proposed_by" uuid,
	"current_salary" integer NOT NULL,
	"proposed_salary" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"justification" text,
	"status" "salary_review_status" DEFAULT 'draft' NOT NULL,
	"approved_by" uuid,
	"cycle" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saml_apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"idp_config_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo" varchar(500),
	"protocol" "idp_protocol" DEFAULT 'saml' NOT NULL,
	"sp_entity_id" varchar(500),
	"acs_url" varchar(500),
	"slo_url" varchar(500),
	"name_id_format" varchar(255) DEFAULT 'email',
	"attribute_mappings" jsonb,
	"status" "idp_app_status" DEFAULT 'pending_setup' NOT NULL,
	"assigned_groups" jsonb,
	"login_count" integer DEFAULT 0,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sandbox_access_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sandbox_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"details" text,
	"ip_address" varchar(50),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sandbox_environments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "sandbox_status" DEFAULT 'provisioning' NOT NULL,
	"created_by" uuid NOT NULL,
	"source_type" varchar(50) DEFAULT 'empty' NOT NULL,
	"source_snapshot_id" uuid,
	"modules" jsonb,
	"data_masking_config" jsonb,
	"connection_string" text,
	"database_name" varchar(255),
	"expires_at" timestamp,
	"paused_at" timestamp,
	"last_accessed_at" timestamp,
	"storage_used_mb" integer DEFAULT 0 NOT NULL,
	"max_storage_mb" integer DEFAULT 1024 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sandbox_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"sandbox_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "sandbox_snapshot_status" DEFAULT 'creating' NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"snapshot_data" jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"query" text NOT NULL,
	"parsed_ast" jsonb,
	"result_columns" jsonb,
	"parameters" jsonb,
	"tags" jsonb,
	"is_public" boolean DEFAULT false NOT NULL,
	"status" "saved_query_status" DEFAULT 'active' NOT NULL,
	"created_by" uuid NOT NULL,
	"last_run_at" timestamp,
	"run_count" integer DEFAULT 0 NOT NULL,
	"avg_execution_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scorm_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"package_url" text NOT NULL,
	"version" varchar(20) DEFAULT 'scorm_2004' NOT NULL,
	"entry_point" varchar(500),
	"metadata" jsonb,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'processing' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scorm_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"package_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"lesson_status" varchar(20) DEFAULT 'not_attempted' NOT NULL,
	"score_raw" real,
	"score_min" real,
	"score_max" real,
	"total_time" varchar(50),
	"suspend_data" text,
	"last_accessed" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "security_policy_type" NOT NULL,
	"settings" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"applies_to" "policy_applies_to" DEFAULT 'all' NOT NULL,
	"target_value" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"date" date NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"break_duration" integer DEFAULT 0 NOT NULL,
	"role" varchar(255),
	"location" varchar(255),
	"status" "shift_status" DEFAULT 'scheduled' NOT NULL,
	"swapped_with" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signature_audit_trail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"actor_id" uuid,
	"actor_email" varchar(255),
	"actor_name" varchar(255),
	"ip_address" varchar(50),
	"user_agent" text,
	"details" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signature_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"document_url" text,
	"status" "signature_status" DEFAULT 'draft' NOT NULL,
	"signing_flow" "signing_flow" DEFAULT 'sequential' NOT NULL,
	"created_by" uuid NOT NULL,
	"template_id" uuid,
	"expires_at" timestamp,
	"completed_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signature_signers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"external_email" varchar(255),
	"external_name" varchar(255),
	"role" varchar(50) DEFAULT 'signer' NOT NULL,
	"signing_order" integer DEFAULT 0 NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"status" "signer_status" DEFAULT 'pending' NOT NULL,
	"signed_at" timestamp,
	"signature_data_url" text,
	"ip_address" varchar(50),
	"user_agent" text,
	"signature_image_url" text,
	"access_token" varchar(255),
	"decline_reason" text,
	"declined_at" timestamp,
	"viewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signature_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"document_url" text,
	"signing_flow" "signing_flow" DEFAULT 'sequential' NOT NULL,
	"signer_roles" jsonb,
	"field_placements" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "software_licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"vendor" varchar(255),
	"total_licenses" integer NOT NULL,
	"used_licenses" integer DEFAULT 0 NOT NULL,
	"cost_per_license" real,
	"currency" varchar(10) DEFAULT 'USD',
	"renewal_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sso_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"entity_id" varchar(500),
	"sso_url" varchar(500),
	"certificate" text,
	"metadata_url" varchar(500),
	"client_id" varchar(255),
	"client_secret" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sso_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"employee_id" uuid,
	"state" varchar(255) NOT NULL,
	"redirect_url" varchar(500),
	"expires_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategic_objectives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "objective_status" DEFAULT 'draft' NOT NULL,
	"owner_id" uuid,
	"period" varchar(50),
	"progress" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "survey_question_branching" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"question_id" varchar(100) NOT NULL,
	"survey_id" uuid,
	"condition" jsonb NOT NULL,
	"action" "branching_action" NOT NULL,
	"target_question_id" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "survey_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"survey_id" uuid,
	"frequency" "survey_frequency" NOT NULL,
	"start_date" date NOT NULL,
	"next_run_date" date,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"target_audience" jsonb,
	"last_run_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(500) NOT NULL,
	"type" "survey_template_type" NOT NULL,
	"questions" jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_triggers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"template_id" uuid,
	"trigger_event" "survey_trigger_event" NOT NULL,
	"delay_days" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"target_audience" jsonb
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"type" "survey_type" NOT NULL,
	"status" "survey_status" DEFAULT 'draft' NOT NULL,
	"start_date" date,
	"end_date" date,
	"anonymous" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"depends_on_task_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"milestone_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"assignee_id" uuid,
	"due_date" date,
	"estimated_hours" real,
	"actual_hours" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tax_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"country" varchar(100) NOT NULL,
	"tax_type" varchar(255) NOT NULL,
	"rate" real NOT NULL,
	"description" text,
	"employer_contribution" real DEFAULT 0,
	"employee_contribution" real DEFAULT 0,
	"effective_date" date,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_filings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"country" varchar(100) NOT NULL,
	"form_name" varchar(255) NOT NULL,
	"description" text,
	"deadline" date,
	"frequency" varchar(50),
	"status" varchar(50) DEFAULT 'upcoming' NOT NULL,
	"filed_date" date,
	"filing_period" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"date" date NOT NULL,
	"clock_in" timestamp NOT NULL,
	"clock_out" timestamp,
	"break_minutes" integer DEFAULT 0 NOT NULL,
	"total_hours" real,
	"overtime_hours" real DEFAULT 0,
	"status" time_entry_status DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"location" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_off_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"policy_id" uuid NOT NULL,
	"balance" real DEFAULT 0 NOT NULL,
	"used" real DEFAULT 0 NOT NULL,
	"pending" real DEFAULT 0 NOT NULL,
	"carryover" real DEFAULT 0 NOT NULL,
	"as_of_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_off_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" time_off_type NOT NULL,
	"accrual_rate" real NOT NULL,
	"accrual_period" "accrual_period" DEFAULT 'monthly' NOT NULL,
	"max_balance" real NOT NULL,
	"carryover_limit" real DEFAULT 0 NOT NULL,
	"waiting_period_days" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"travel_request_id" uuid NOT NULL,
	"type" "travel_booking_type" NOT NULL,
	"status" "travel_booking_status" DEFAULT 'pending' NOT NULL,
	"provider" varchar(255),
	"confirmation_number" varchar(255),
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"details" jsonb,
	"start_date" date NOT NULL,
	"end_date" date,
	"cancellation_policy" text,
	"booked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"max_flight_class" varchar(50) DEFAULT 'economy' NOT NULL,
	"max_hotel_rate" integer,
	"max_car_class" varchar(50),
	"max_daily_meals" integer,
	"advance_booking_days" integer DEFAULT 14,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"approval_threshold" integer,
	"preferred_airlines" jsonb,
	"preferred_hotels" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"destination" varchar(255) NOT NULL,
	"departure_date" date NOT NULL,
	"return_date" date NOT NULL,
	"estimated_cost" integer,
	"actual_cost" integer,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"status" "travel_request_status" DEFAULT 'draft' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"policy_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vault_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"type" "vault_item_type" DEFAULT 'login' NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" varchar(500),
	"username" varchar(255),
	"encrypted_password" text,
	"notes" text,
	"custom_fields" jsonb,
	"tags" jsonb,
	"password_strength" varchar(20),
	"last_used_at" timestamp,
	"password_changed_at" timestamp,
	"auto_fill" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_email" varchar(255),
	"category" varchar(100),
	"status" "vendor_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_screen_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"status" "video_screen_status" DEFAULT 'draft' NOT NULL,
	"access_token" varchar(255) NOT NULL,
	"sent_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_screen_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invite_id" uuid NOT NULL,
	"question_index" integer NOT NULL,
	"video_url" text,
	"thumbnail_url" text,
	"duration" integer,
	"transcription" text,
	"ai_analysis" jsonb,
	"reviewer_notes" text,
	"reviewer_rating" integer,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_screen_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"questions" jsonb NOT NULL,
	"intro_video_url" text,
	"branding_config" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"integration_id" uuid,
	"url" varchar(500) NOT NULL,
	"secret" varchar(255) NOT NULL,
	"events" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_called_at" timestamp,
	"failure_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workers_comp_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"audit_date" date,
	"period" varchar(100),
	"auditor" varchar(255),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"findings" text,
	"adjustment_amount" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workers_comp_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"policy_id" uuid,
	"employee_name" varchar(255),
	"incident_date" date,
	"description" text,
	"injury_type" varchar(100),
	"body_part" varchar(100),
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"reserve_amount" integer,
	"paid_amount" integer DEFAULT 0,
	"filed_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workers_comp_class_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"description" varchar(500),
	"rate" real,
	"employee_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workers_comp_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"carrier" varchar(255),
	"policy_number" varchar(100),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"effective_date" date,
	"expiry_date" date,
	"premium" integer,
	"covered_employees" integer,
	"class_codes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"workflow_id" uuid NOT NULL,
	"status" "run_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"triggered_by" varchar(100),
	"context" jsonb
);
--> statement-breakpoint
CREATE TABLE "workflow_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"step_type" "step_type" DEFAULT 'action' NOT NULL,
	"title" varchar(255) NOT NULL,
	"config" jsonb,
	"position" integer DEFAULT 0 NOT NULL,
	"next_step_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "workflow_status" DEFAULT 'draft' NOT NULL,
	"trigger_type" "trigger_type" DEFAULT 'manual' NOT NULL,
	"trigger_config" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "aca_tracking" ADD CONSTRAINT "aca_tracking_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aca_tracking" ADD CONSTRAINT "aca_tracking_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_platform_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."platform_admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advanced_expense_policies" ADD CONSTRAINT "advanced_expense_policies_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_assignments" ADD CONSTRAINT "app_assignments_app_id_app_catalog_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_assignments" ADD CONSTRAINT "app_assignments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_assignments" ADD CONSTRAINT "app_assignments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_catalog" ADD CONSTRAINT "app_catalog_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_components" ADD CONSTRAINT "app_components_page_id_app_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."app_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_data_sources" ADD CONSTRAINT "app_data_sources_app_id_custom_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."custom_apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_pages" ADD CONSTRAINT "app_pages_app_id_custom_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."custom_apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_chains" ADD CONSTRAINT "approval_chains_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_chain_id_approval_chains_id_fk" FOREIGN KEY ("chain_id") REFERENCES "public"."approval_chains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_approver_id_employees_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_course_content_id_course_content_id_fk" FOREIGN KEY ("course_content_id") REFERENCES "public"."course_content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_enroll_rules" ADD CONSTRAINT "auto_enroll_rules_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_enroll_rules" ADD CONSTRAINT "auto_enroll_rules_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_workflow_run_steps" ADD CONSTRAINT "automation_workflow_run_steps_run_id_automation_workflow_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."automation_workflow_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_workflow_run_steps" ADD CONSTRAINT "automation_workflow_run_steps_step_id_automation_workflow_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."automation_workflow_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_workflow_runs" ADD CONSTRAINT "automation_workflow_runs_workflow_id_automation_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."automation_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_workflow_runs" ADD CONSTRAINT "automation_workflow_runs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_workflow_steps" ADD CONSTRAINT "automation_workflow_steps_workflow_id_automation_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."automation_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_workflows" ADD CONSTRAINT "automation_workflows_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_workflows" ADD CONSTRAINT "automation_workflows_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "background_checks" ADD CONSTRAINT "background_checks_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "background_checks" ADD CONSTRAINT "background_checks_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "background_checks" ADD CONSTRAINT "background_checks_requested_by_employees_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benefit_dependents" ADD CONSTRAINT "benefit_dependents_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benefit_dependents" ADD CONSTRAINT "benefit_dependents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benefit_enrollments" ADD CONSTRAINT "benefit_enrollments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benefit_enrollments" ADD CONSTRAINT "benefit_enrollments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benefit_enrollments" ADD CONSTRAINT "benefit_enrollments_plan_id_benefit_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."benefit_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benefit_plans" ADD CONSTRAINT "benefit_plans_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_pay_schedules" ADD CONSTRAINT "bill_pay_schedules_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_pay_schedules" ADD CONSTRAINT "bill_pay_schedules_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyback_requests" ADD CONSTRAINT "buyback_requests_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyback_requests" ADD CONSTRAINT "buyback_requests_device_id_managed_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."managed_devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyback_requests" ADD CONSTRAINT "buyback_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyback_requests" ADD CONSTRAINT "buyback_requests_evaluated_by_employees_id_fk" FOREIGN KEY ("evaluated_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_scheduling" ADD CONSTRAINT "candidate_scheduling_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_scheduling" ADD CONSTRAINT "candidate_scheduling_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_spend_limits" ADD CONSTRAINT "card_spend_limits_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_spend_limits" ADD CONSTRAINT "card_spend_limits_card_id_corporate_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."corporate_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_transactions" ADD CONSTRAINT "card_transactions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_transactions" ADD CONSTRAINT "card_transactions_card_id_corporate_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."corporate_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_transactions" ADD CONSTRAINT "card_transactions_expense_report_id_expense_reports_id_fk" FOREIGN KEY ("expense_report_id") REFERENCES "public"."expense_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carrier_integrations" ADD CONSTRAINT "carrier_integrations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_channel_members" ADD CONSTRAINT "chat_channel_members_channel_id_chat_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."chat_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_channel_members" ADD CONSTRAINT "chat_channel_members_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_channel_members" ADD CONSTRAINT "chat_channel_members_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_channel_id_chat_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."chat_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_employees_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_pinned_by_employees_id_fk" FOREIGN KEY ("pinned_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_channel_id_chat_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."chat_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_reactions" ADD CONSTRAINT "chat_reactions_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_reactions" ADD CONSTRAINT "chat_reactions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_reactions" ADD CONSTRAINT "chat_reactions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "co_employment_records" ADD CONSTRAINT "co_employment_records_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "co_employment_records" ADD CONSTRAINT "co_employment_records_peo_config_id_peo_configurations_id_fk" FOREIGN KEY ("peo_config_id") REFERENCES "public"."peo_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "co_employment_records" ADD CONSTRAINT "co_employment_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cobra_events" ADD CONSTRAINT "cobra_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cobra_events" ADD CONSTRAINT "cobra_events_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comp_bands" ADD CONSTRAINT "comp_bands_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_alerts" ADD CONSTRAINT "compliance_alerts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_alerts" ADD CONSTRAINT "compliance_alerts_requirement_id_compliance_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."compliance_requirements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_requirement_id_compliance_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."compliance_requirements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_uploaded_by_employees_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_requirements" ADD CONSTRAINT "compliance_requirements_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_requirements" ADD CONSTRAINT "compliance_requirements_assigned_to_employees_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_block_progress" ADD CONSTRAINT "content_block_progress_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_block_progress" ADD CONSTRAINT "content_block_progress_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_block_progress" ADD CONSTRAINT "content_block_progress_block_id_course_content_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."course_content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_library" ADD CONSTRAINT "content_library_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_payments" ADD CONSTRAINT "contractor_payments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cor_contractors" ADD CONSTRAINT "cor_contractors_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cor_contracts" ADD CONSTRAINT "cor_contracts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cor_contracts" ADD CONSTRAINT "cor_contracts_contractor_id_cor_contractors_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."cor_contractors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cor_payments" ADD CONSTRAINT "cor_payments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cor_payments" ADD CONSTRAINT "cor_payments_contractor_id_cor_contractors_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."cor_contractors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cor_payments" ADD CONSTRAINT "cor_payments_contract_id_cor_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."cor_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cor_payments" ADD CONSTRAINT "cor_payments_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_cards" ADD CONSTRAINT "corporate_cards_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_cards" ADD CONSTRAINT "corporate_cards_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_benefit_configs" ADD CONSTRAINT "country_benefit_configs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_content" ADD CONSTRAINT "course_content_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_prerequisite_course_id_courses_id_fk" FOREIGN KEY ("prerequisite_course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "currency_accounts" ADD CONSTRAINT "currency_accounts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_apps" ADD CONSTRAINT "custom_apps_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_apps" ADD CONSTRAINT "custom_apps_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_apps" ADD CONSTRAINT "custom_apps_published_by_employees_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_field_definition_id_custom_field_definitions_id_fk" FOREIGN KEY ("field_definition_id") REFERENCES "public"."custom_field_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment_profiles" ADD CONSTRAINT "deployment_profiles_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_actions" ADD CONSTRAINT "device_actions_device_id_managed_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."managed_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_actions" ADD CONSTRAINT "device_actions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_actions" ADD CONSTRAINT "device_actions_initiated_by_employees_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_enrollment_tokens" ADD CONSTRAINT "device_enrollment_tokens_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_enrollment_tokens" ADD CONSTRAINT "device_enrollment_tokens_profile_id_deployment_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."deployment_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_enrollment_tokens" ADD CONSTRAINT "device_enrollment_tokens_assigned_to_employees_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_enrollment_tokens" ADD CONSTRAINT "device_enrollment_tokens_device_id_managed_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."managed_devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_inventory" ADD CONSTRAINT "device_inventory_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_inventory" ADD CONSTRAINT "device_inventory_assigned_to_employees_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_orders" ADD CONSTRAINT "device_orders_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_orders" ADD CONSTRAINT "device_orders_catalog_item_id_device_store_catalog_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."device_store_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_orders" ADD CONSTRAINT "device_orders_requester_id_employees_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_orders" ADD CONSTRAINT "device_orders_for_employee_id_employees_id_fk" FOREIGN KEY ("for_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_orders" ADD CONSTRAINT "device_orders_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_store_catalog" ADD CONSTRAINT "device_store_catalog_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_assigned_to_employees_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_detection" ADD CONSTRAINT "duplicate_detection_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_detection" ADD CONSTRAINT "duplicate_detection_expense_item_id_expense_items_id_fk" FOREIGN KEY ("expense_item_id") REFERENCES "public"."expense_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_detection" ADD CONSTRAINT "duplicate_detection_duplicate_of_id_expense_items_id_fk" FOREIGN KEY ("duplicate_of_id") REFERENCES "public"."expense_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_detection" ADD CONSTRAINT "duplicate_detection_reviewed_by_employees_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_groups" ADD CONSTRAINT "dynamic_groups_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_groups" ADD CONSTRAINT "dynamic_groups_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_payroll_entries" ADD CONSTRAINT "employee_payroll_entries_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_payroll_entries" ADD CONSTRAINT "employee_payroll_entries_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_payroll_entries" ADD CONSTRAINT "employee_payroll_entries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_scores" ADD CONSTRAINT "engagement_scores_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagement_scores" ADD CONSTRAINT "engagement_scores_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_feeds" ADD CONSTRAINT "enrollment_feeds_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_feeds" ADD CONSTRAINT "enrollment_feeds_carrier_id_carrier_integrations_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."carrier_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eor_contracts" ADD CONSTRAINT "eor_contracts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eor_contracts" ADD CONSTRAINT "eor_contracts_eor_employee_id_eor_employees_id_fk" FOREIGN KEY ("eor_employee_id") REFERENCES "public"."eor_employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eor_employees" ADD CONSTRAINT "eor_employees_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eor_employees" ADD CONSTRAINT "eor_employees_eor_entity_id_eor_entities_id_fk" FOREIGN KEY ("eor_entity_id") REFERENCES "public"."eor_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eor_employees" ADD CONSTRAINT "eor_employees_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eor_entities" ADD CONSTRAINT "eor_entities_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equity_grants" ADD CONSTRAINT "equity_grants_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equity_grants" ADD CONSTRAINT "equity_grants_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "everify_cases" ADD CONSTRAINT "everify_cases_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "everify_cases" ADD CONSTRAINT "everify_cases_i9_form_id_i9_forms_id_fk" FOREIGN KEY ("i9_form_id") REFERENCES "public"."i9_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "everify_cases" ADD CONSTRAINT "everify_cases_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "everify_cases" ADD CONSTRAINT "everify_cases_submitted_by_employees_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exit_surveys" ADD CONSTRAINT "exit_surveys_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exit_surveys" ADD CONSTRAINT "exit_surveys_process_id_offboarding_processes_id_fk" FOREIGN KEY ("process_id") REFERENCES "public"."offboarding_processes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exit_surveys" ADD CONSTRAINT "exit_surveys_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_report_id_expense_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."expense_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_policies" ADD CONSTRAINT "expense_policies_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_reports" ADD CONSTRAINT "expense_reports_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_reports" ADD CONSTRAINT "expense_reports_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_reports" ADD CONSTRAINT "expense_reports_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_from_id_employees_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_to_id_employees_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_uploaded_by_employees_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flex_benefit_accounts" ADD CONSTRAINT "flex_benefit_accounts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flex_benefit_accounts" ADD CONSTRAINT "flex_benefit_accounts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flex_benefit_transactions" ADD CONSTRAINT "flex_benefit_transactions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flex_benefit_transactions" ADD CONSTRAINT "flex_benefit_transactions_account_id_flex_benefit_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."flex_benefit_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fx_transactions" ADD CONSTRAINT "fx_transactions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_zone_id_geofence_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."geofence_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_time_entry_id_time_entries_id_fk" FOREIGN KEY ("time_entry_id") REFERENCES "public"."time_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_zones" ADD CONSTRAINT "geofence_zones_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_benefit_enrollments" ADD CONSTRAINT "global_benefit_enrollments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_benefit_enrollments" ADD CONSTRAINT "global_benefit_enrollments_plan_id_global_benefit_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."global_benefit_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_benefit_enrollments" ADD CONSTRAINT "global_benefit_enrollments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_benefit_plans" ADD CONSTRAINT "global_benefit_plans_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "i9_documents" ADD CONSTRAINT "i9_documents_i9_form_id_i9_forms_id_fk" FOREIGN KEY ("i9_form_id") REFERENCES "public"."i9_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "i9_documents" ADD CONSTRAINT "i9_documents_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "i9_documents" ADD CONSTRAINT "i9_documents_verified_by_employees_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "i9_forms" ADD CONSTRAINT "i9_forms_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "i9_forms" ADD CONSTRAINT "i9_forms_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "i9_forms" ADD CONSTRAINT "i9_forms_verified_by_employees_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idp_configurations" ADD CONSTRAINT "idp_configurations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonation_log" ADD CONSTRAINT "impersonation_log_admin_id_platform_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."platform_admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiatives" ADD CONSTRAINT "initiatives_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiatives" ADD CONSTRAINT "initiatives_objective_id_strategic_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "public"."strategic_objectives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiatives" ADD CONSTRAINT "initiatives_owner_id_employees_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_recordings" ADD CONSTRAINT "interview_recordings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_recordings" ADD CONSTRAINT "interview_recordings_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_transcriptions" ADD CONSTRAINT "interview_transcriptions_recording_id_interview_recordings_id_fk" FOREIGN KEY ("recording_id") REFERENCES "public"."interview_recordings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_transcriptions" ADD CONSTRAINT "interview_transcriptions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_requests" ADD CONSTRAINT "it_requests_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_requests" ADD CONSTRAINT "it_requests_requester_id_employees_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "it_requests" ADD CONSTRAINT "it_requests_assigned_to_employees_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_objective_id_strategic_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "public"."strategic_objectives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_owner_id_employees_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knockout_questions" ADD CONSTRAINT "knockout_questions_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knockout_questions" ADD CONSTRAINT "knockout_questions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_definitions" ADD CONSTRAINT "kpi_definitions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_definitions" ADD CONSTRAINT "kpi_definitions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_definitions" ADD CONSTRAINT "kpi_definitions_owner_id_employees_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_measurements" ADD CONSTRAINT "kpi_measurements_kpi_id_kpi_definitions_id_fk" FOREIGN KEY ("kpi_id") REFERENCES "public"."kpi_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_badges" ADD CONSTRAINT "learner_badges_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_badges" ADD CONSTRAINT "learner_badges_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_badges" ADD CONSTRAINT "learner_badges_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_points" ADD CONSTRAINT "learner_points_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_points" ADD CONSTRAINT "learner_points_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "life_events" ADD CONSTRAINT "life_events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "life_events" ADD CONSTRAINT "life_events_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "managed_devices" ADD CONSTRAINT "managed_devices_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "managed_devices" ADD CONSTRAINT "managed_devices_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_pairs" ADD CONSTRAINT "mentoring_pairs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_pairs" ADD CONSTRAINT "mentoring_pairs_program_id_mentoring_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."mentoring_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_pairs" ADD CONSTRAINT "mentoring_pairs_mentor_id_employees_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_pairs" ADD CONSTRAINT "mentoring_pairs_mentee_id_employees_id_fk" FOREIGN KEY ("mentee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_programs" ADD CONSTRAINT "mentoring_programs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merit_cycles" ADD CONSTRAINT "merit_cycles_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merit_cycles" ADD CONSTRAINT "merit_cycles_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merit_recommendations" ADD CONSTRAINT "merit_recommendations_cycle_id_merit_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."merit_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merit_recommendations" ADD CONSTRAINT "merit_recommendations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merit_recommendations" ADD CONSTRAINT "merit_recommendations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merit_recommendations" ADD CONSTRAINT "merit_recommendations_manager_id_employees_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merit_recommendations" ADD CONSTRAINT "merit_recommendations_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_enrollments" ADD CONSTRAINT "mfa_enrollments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_enrollments" ADD CONSTRAINT "mfa_enrollments_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfa_policies" ADD CONSTRAINT "mfa_policies_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mileage_entries" ADD CONSTRAINT "mileage_entries_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mileage_entries" ADD CONSTRAINT "mileage_entries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mileage_entries" ADD CONSTRAINT "mileage_entries_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_employees_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_employees_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_checklist_items" ADD CONSTRAINT "offboarding_checklist_items_checklist_id_offboarding_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."offboarding_checklists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_checklists" ADD CONSTRAINT "offboarding_checklists_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_processes" ADD CONSTRAINT "offboarding_processes_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_processes" ADD CONSTRAINT "offboarding_processes_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_processes" ADD CONSTRAINT "offboarding_processes_initiated_by_employees_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_processes" ADD CONSTRAINT "offboarding_processes_checklist_id_offboarding_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."offboarding_checklists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_tasks" ADD CONSTRAINT "offboarding_tasks_process_id_offboarding_processes_id_fk" FOREIGN KEY ("process_id") REFERENCES "public"."offboarding_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_tasks" ADD CONSTRAINT "offboarding_tasks_checklist_item_id_offboarding_checklist_items_id_fk" FOREIGN KEY ("checklist_item_id") REFERENCES "public"."offboarding_checklist_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_tasks" ADD CONSTRAINT "offboarding_tasks_assignee_id_employees_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offboarding_tasks" ADD CONSTRAINT "offboarding_tasks_completed_by_employees_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_ended_responses" ADD CONSTRAINT "open_ended_responses_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_enrollment_periods" ADD CONSTRAINT "open_enrollment_periods_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_rules" ADD CONSTRAINT "overtime_rules_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_vaults" ADD CONSTRAINT "password_vaults_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_vaults" ADD CONSTRAINT "password_vaults_owner_id_employees_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_schedules" ADD CONSTRAINT "payroll_schedules_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peo_configurations" ADD CONSTRAINT "peo_configurations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peo_employee_enrollments" ADD CONSTRAINT "peo_employee_enrollments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peo_employee_enrollments" ADD CONSTRAINT "peo_employee_enrollments_peo_config_id_peo_configurations_id_fk" FOREIGN KEY ("peo_config_id") REFERENCES "public"."peo_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peo_employee_enrollments" ADD CONSTRAINT "peo_employee_enrollments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peo_invoices" ADD CONSTRAINT "peo_invoices_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peo_invoices" ADD CONSTRAINT "peo_invoices_peo_config_id_peo_configurations_id_fk" FOREIGN KEY ("peo_config_id") REFERENCES "public"."peo_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peo_workers_comp_codes" ADD CONSTRAINT "peo_workers_comp_codes_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peo_workers_comp_codes" ADD CONSTRAINT "peo_workers_comp_codes_peo_config_id_peo_configurations_id_fk" FOREIGN KEY ("peo_config_id") REFERENCES "public"."peo_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_improvement_plans" ADD CONSTRAINT "performance_improvement_plans_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_improvement_plans" ADD CONSTRAINT "performance_improvement_plans_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_improvement_plans" ADD CONSTRAINT "performance_improvement_plans_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pip_check_ins" ADD CONSTRAINT "pip_check_ins_pip_id_performance_improvement_plans_id_fk" FOREIGN KEY ("pip_id") REFERENCES "public"."performance_improvement_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pip_check_ins" ADD CONSTRAINT "pip_check_ins_conducted_by_employees_id_fk" FOREIGN KEY ("conducted_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_requester_id_employees_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_employees_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "query_schedules" ADD CONSTRAINT "query_schedules_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "query_schedules" ADD CONSTRAINT "query_schedules_query_id_saved_queries_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."saved_queries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_course_content_id_course_content_id_fk" FOREIGN KEY ("course_content_id") REFERENCES "public"."course_content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_matching" ADD CONSTRAINT "receipt_matching_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_matching" ADD CONSTRAINT "receipt_matching_expense_item_id_expense_items_id_fk" FOREIGN KEY ("expense_item_id") REFERENCES "public"."expense_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_programs" ADD CONSTRAINT "referral_programs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_employees_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reimbursement_batches" ADD CONSTRAINT "reimbursement_batches_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reimbursement_batches" ADD CONSTRAINT "reimbursement_batches_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reimbursement_items" ADD CONSTRAINT "reimbursement_items_batch_id_reimbursement_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."reimbursement_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reimbursement_items" ADD CONSTRAINT "reimbursement_items_expense_report_id_expense_reports_id_fk" FOREIGN KEY ("expense_report_id") REFERENCES "public"."expense_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reimbursement_items" ADD CONSTRAINT "reimbursement_items_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retirement_contributions" ADD CONSTRAINT "retirement_contributions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retirement_contributions" ADD CONSTRAINT "retirement_contributions_plan_id_retirement_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."retirement_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retirement_contributions" ADD CONSTRAINT "retirement_contributions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retirement_contributions" ADD CONSTRAINT "retirement_contributions_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retirement_enrollments" ADD CONSTRAINT "retirement_enrollments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retirement_enrollments" ADD CONSTRAINT "retirement_enrollments_plan_id_retirement_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."retirement_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retirement_enrollments" ADD CONSTRAINT "retirement_enrollments_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retirement_plans" ADD CONSTRAINT "retirement_plans_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_cycles" ADD CONSTRAINT "review_cycles_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_templates" ADD CONSTRAINT "review_templates_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_templates" ADD CONSTRAINT "review_templates_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_cycle_id_review_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."review_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_employees_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_reviews" ADD CONSTRAINT "salary_reviews_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_reviews" ADD CONSTRAINT "salary_reviews_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_reviews" ADD CONSTRAINT "salary_reviews_proposed_by_employees_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_reviews" ADD CONSTRAINT "salary_reviews_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saml_apps" ADD CONSTRAINT "saml_apps_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saml_apps" ADD CONSTRAINT "saml_apps_idp_config_id_idp_configurations_id_fk" FOREIGN KEY ("idp_config_id") REFERENCES "public"."idp_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sandbox_access_log" ADD CONSTRAINT "sandbox_access_log_sandbox_id_sandbox_environments_id_fk" FOREIGN KEY ("sandbox_id") REFERENCES "public"."sandbox_environments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sandbox_access_log" ADD CONSTRAINT "sandbox_access_log_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sandbox_access_log" ADD CONSTRAINT "sandbox_access_log_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sandbox_environments" ADD CONSTRAINT "sandbox_environments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sandbox_environments" ADD CONSTRAINT "sandbox_environments_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sandbox_snapshots" ADD CONSTRAINT "sandbox_snapshots_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sandbox_snapshots" ADD CONSTRAINT "sandbox_snapshots_sandbox_id_sandbox_environments_id_fk" FOREIGN KEY ("sandbox_id") REFERENCES "public"."sandbox_environments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sandbox_snapshots" ADD CONSTRAINT "sandbox_snapshots_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_queries" ADD CONSTRAINT "saved_queries_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_queries" ADD CONSTRAINT "saved_queries_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_packages" ADD CONSTRAINT "scorm_packages_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_tracking" ADD CONSTRAINT "scorm_tracking_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_tracking" ADD CONSTRAINT "scorm_tracking_package_id_scorm_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."scorm_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_tracking" ADD CONSTRAINT "scorm_tracking_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_policies" ADD CONSTRAINT "security_policies_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_swapped_with_employees_id_fk" FOREIGN KEY ("swapped_with") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_audit_trail" ADD CONSTRAINT "signature_audit_trail_document_id_signature_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."signature_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_audit_trail" ADD CONSTRAINT "signature_audit_trail_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_audit_trail" ADD CONSTRAINT "signature_audit_trail_actor_id_employees_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_documents" ADD CONSTRAINT "signature_documents_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_documents" ADD CONSTRAINT "signature_documents_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_signers" ADD CONSTRAINT "signature_signers_document_id_signature_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."signature_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_signers" ADD CONSTRAINT "signature_signers_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_signers" ADD CONSTRAINT "signature_signers_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_templates" ADD CONSTRAINT "signature_templates_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_templates" ADD CONSTRAINT "signature_templates_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "software_licenses" ADD CONSTRAINT "software_licenses_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sso_providers" ADD CONSTRAINT "sso_providers_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sso_sessions" ADD CONSTRAINT "sso_sessions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sso_sessions" ADD CONSTRAINT "sso_sessions_provider_id_sso_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."sso_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sso_sessions" ADD CONSTRAINT "sso_sessions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategic_objectives" ADD CONSTRAINT "strategic_objectives_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategic_objectives" ADD CONSTRAINT "strategic_objectives_owner_id_employees_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_question_branching" ADD CONSTRAINT "survey_question_branching_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_question_branching" ADD CONSTRAINT "survey_question_branching_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_schedules" ADD CONSTRAINT "survey_schedules_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_schedules" ADD CONSTRAINT "survey_schedules_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_templates" ADD CONSTRAINT "survey_templates_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_triggers" ADD CONSTRAINT "survey_triggers_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_triggers" ADD CONSTRAINT "survey_triggers_template_id_survey_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."survey_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_depends_on_task_id_tasks_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_employees_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_configs" ADD CONSTRAINT "tax_configs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_filings" ADD CONSTRAINT "tax_filings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_balances" ADD CONSTRAINT "time_off_balances_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_balances" ADD CONSTRAINT "time_off_balances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_balances" ADD CONSTRAINT "time_off_balances_policy_id_time_off_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."time_off_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_policies" ADD CONSTRAINT "time_off_policies_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_bookings" ADD CONSTRAINT "travel_bookings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_bookings" ADD CONSTRAINT "travel_bookings_travel_request_id_travel_requests_id_fk" FOREIGN KEY ("travel_request_id") REFERENCES "public"."travel_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_policies" ADD CONSTRAINT "travel_policies_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_requests" ADD CONSTRAINT "travel_requests_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_requests" ADD CONSTRAINT "travel_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_requests" ADD CONSTRAINT "travel_requests_approved_by_employees_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_requests" ADD CONSTRAINT "travel_requests_policy_id_travel_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."travel_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_items" ADD CONSTRAINT "vault_items_vault_id_password_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."password_vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_items" ADD CONSTRAINT "vault_items_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_screen_invites" ADD CONSTRAINT "video_screen_invites_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_screen_invites" ADD CONSTRAINT "video_screen_invites_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_screen_invites" ADD CONSTRAINT "video_screen_invites_template_id_video_screen_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."video_screen_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_screen_responses" ADD CONSTRAINT "video_screen_responses_invite_id_video_screen_invites_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."video_screen_invites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_screen_responses" ADD CONSTRAINT "video_screen_responses_reviewed_by_employees_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_screen_templates" ADD CONSTRAINT "video_screen_templates_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers_comp_audits" ADD CONSTRAINT "workers_comp_audits_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers_comp_claims" ADD CONSTRAINT "workers_comp_claims_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers_comp_claims" ADD CONSTRAINT "workers_comp_claims_policy_id_workers_comp_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."workers_comp_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers_comp_class_codes" ADD CONSTRAINT "workers_comp_class_codes_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers_comp_policies" ADD CONSTRAINT "workers_comp_policies_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_created_by_employees_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;