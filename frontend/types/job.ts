export interface Job {
  job_id: string;
  company_id: string;
  title: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  created_at: string;
  company_name?: string;
  email?: string;
}

export interface CreateJobDto {
  title: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
}

export interface UpdateJobDto extends Partial<CreateJobDto> {}
