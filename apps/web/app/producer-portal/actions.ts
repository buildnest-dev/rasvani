'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';

const applicantRoles = ['customer', 'producer'] as const;
const validRegions = new Set([
  'andhra-pradesh','arunachal-pradesh','assam','bihar','chhattisgarh','goa','gujarat','haryana',
  'himachal-pradesh','jharkhand','karnataka','kerala','madhya-pradesh','maharashtra','manipur',
  'meghalaya','mizoram','nagaland','odisha','punjab','rajasthan','sikkim','tamil-nadu','telangana',
  'tripura','uttar-pradesh','uttarakhand','west-bengal','andaman-and-nicobar-islands','chandigarh',
  'dadra-and-nagar-haveli-and-daman-and-diu','delhi','jammu-and-kashmir','ladakh','lakshadweep','puducherry',
]);

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

export async function submitProducerApplication(formData: FormData) {
  await requireAnyRole(applicantRoles);
  const legalName = field(formData, 'legal_name');
  const regionId = field(formData, 'region_id');
  const contactName = field(formData, 'contact_name');
  const contactEmail = field(formData, 'contact_email');
  const phone = field(formData, 'phone');
  const productCategories = field(formData, 'product_categories');
  const introduction = field(formData, 'introduction');

  if (!legalName || legalName.length > 180 || !validRegions.has(regionId) || !contactEmail || !introduction) {
    redirect('/producer-portal?error=complete-fields');
  }
  if (contactEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    redirect('/producer-portal?error=invalid-email');
  }
  if (phone.length > 30 || contactName.length > 120 || introduction.length > 3000 || productCategories.length > 600) {
    redirect('/producer-portal?error=field-length');
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('submit_producer_application', {
    p_legal_name: legalName,
    p_region_id: regionId,
    p_contact_details: { contact_name: contactName, email: contactEmail, phone },
    p_application_data: { product_categories: productCategories, introduction },
  });
  if (error) redirect('/producer-portal?error=submission-failed');
  revalidatePath('/producer-portal');
  redirect('/producer-portal?submitted=1');
}
