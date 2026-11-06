'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';

const producerRoles = ['producer'] as const;
const regions = new Set([
  'andhra-pradesh','arunachal-pradesh','assam','bihar','chhattisgarh','goa','gujarat','haryana',
  'himachal-pradesh','jharkhand','karnataka','kerala','madhya-pradesh','maharashtra','manipur',
  'meghalaya','mizoram','nagaland','odisha','punjab','rajasthan','sikkim','tamil-nadu','telangana',
  'tripura','uttar-pradesh','uttarakhand','west-bengal','andaman-and-nicobar-islands','chandigarh',
  'dadra-and-nagar-haveli-and-daman-and-diu','delhi','jammu-and-kashmir','ladakh','lakshadweep','puducherry',
]);
const value = (form: FormData, key: string) => String(form.get(key) ?? '').trim();

export async function submitProducerFacility(form: FormData) {
  await requireAnyRole(producerRoles);
  const name = value(form, 'facility_name');
  const regionId = value(form, 'region_id');
  const addressLine1 = value(form, 'address_line_1');
  const addressLine2 = value(form, 'address_line_2');
  const city = value(form, 'city');
  const district = value(form, 'district');
  const postalCode = value(form, 'postal_code');
  const facilityType = value(form, 'facility_type');
  const capabilities = form.getAll('storage_capabilities').map(String);
  if (!name || name.length > 180 || !regions.has(regionId) || !addressLine1 || addressLine1.length > 180 ||
      addressLine2.length > 180 || !city || city.length > 100 || district.length > 100 ||
      !/^[1-9][0-9]{5}$/.test(postalCode) || !['processing','manufacturing','storage','farm','other'].includes(facilityType) ||
      capabilities.length > 4 || capabilities.some((item) => !['ambient','chilled','frozen','other'].includes(item))) {
    redirect('/producer-portal/facilities?error=invalid-fields');
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('submit_producer_facility', {
    p_name: name,
    p_region_id: regionId,
    p_address: {
      address_line_1: addressLine1,
      address_line_2: addressLine2 || null,
      city,
      district: district || null,
      postal_code: postalCode,
      facility_type: facilityType,
      storage_capabilities: capabilities,
    },
  });
  if (error) redirect('/producer-portal/facilities?error=submission-failed');
  revalidatePath('/producer-portal/facilities');
  revalidatePath('/facility-review');
  revalidatePath('/admin');
  redirect('/producer-portal/facilities?submitted=1');
}
