import { api } from './client';
import type { Contact, ContactFilter } from './contacts';

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  filterJson: ContactFilter;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSegmentInput {
  name: string;
  description?: string;
  filter: ContactFilter;
}

export interface SegmentPreview {
  count: number;
  sample: Contact[];
}

export async function listSegments(): Promise<Segment[]> {
  const { data } = await api.get<Segment[]>('/segments');
  return data;
}

export async function getSegment(id: string): Promise<Segment> {
  const { data } = await api.get<Segment>(`/segments/${id}`);
  return data;
}

export async function createSegment(input: CreateSegmentInput): Promise<Segment> {
  const { data } = await api.post<Segment>('/segments', input);
  return data;
}

export async function updateSegment(id: string, input: Partial<CreateSegmentInput>): Promise<Segment> {
  const { data } = await api.patch<Segment>(`/segments/${id}`, input);
  return data;
}

export async function deleteSegment(id: string): Promise<void> {
  await api.delete(`/segments/${id}`);
}

export async function previewSegment(id: string): Promise<SegmentPreview> {
  const { data } = await api.get<SegmentPreview>(`/segments/${id}/preview`);
  return data;
}
