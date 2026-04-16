// Saudi Arabia administrative regions → cities
// Source: ZATCA e-invoicing address requirements

export type Country = {
  code: string;
  nameAr: string;
  nameEn: string;
  regions: Region[];
};

export type Region = {
  nameAr: string;
  nameEn: string;
  cities: City[];
};

export type City = {
  nameAr: string;
  nameEn: string;
};

export const countries: Country[] = [
  {
    code: 'SA',
    nameAr: 'المملكة العربية السعودية',
    nameEn: 'Saudi Arabia',
    regions: [
      {
        nameAr: 'منطقة الرياض',
        nameEn: 'Riyadh Region',
        cities: [
          { nameAr: 'الرياض', nameEn: 'Riyadh' },
          { nameAr: 'الخرج', nameEn: 'Al Kharj' },
          { nameAr: 'الدرعية', nameEn: 'Diriyah' },
          { nameAr: 'الزلفي', nameEn: 'Az Zulfi' },
          { nameAr: 'المجمعة', nameEn: 'Al Majmaah' },
          { nameAr: 'وادي الدواسر', nameEn: 'Wadi ad-Dawasir' },
          { nameAr: 'الأفلاج', nameEn: 'Al Aflaj' },
          { nameAr: 'حوطة بني تميم', nameEn: 'Howtat Bani Tamim' },
          { nameAr: 'الدوادمي', nameEn: 'Ad Dawadmi' },
          { nameAr: 'شقراء', nameEn: 'Shaqra' },
        ],
      },
      {
        nameAr: 'منطقة مكة المكرمة',
        nameEn: 'Makkah Region',
        cities: [
          { nameAr: 'مكة المكرمة', nameEn: 'Makkah' },
          { nameAr: 'جدة', nameEn: 'Jeddah' },
          { nameAr: 'الطائف', nameEn: 'Taif' },
          { nameAr: 'رابغ', nameEn: 'Rabigh' },
          { nameAr: 'القنفذة', nameEn: 'Al Qunfudhah' },
          { nameAr: 'الليث', nameEn: 'Al Lith' },
          { nameAr: 'خليص', nameEn: 'Khulays' },
        ],
      },
      {
        nameAr: 'المنطقة الشرقية',
        nameEn: 'Eastern Province',
        cities: [
          { nameAr: 'الدمام', nameEn: 'Dammam' },
          { nameAr: 'الظهران', nameEn: 'Dhahran' },
          { nameAr: 'الخبر', nameEn: 'Al Khobar' },
          { nameAr: 'الأحساء', nameEn: 'Al-Ahsa' },
          { nameAr: 'حفر الباطن', nameEn: 'Hafar Al-Batin' },
          { nameAr: 'الجبيل', nameEn: 'Jubail' },
          { nameAr: 'القطيف', nameEn: 'Qatif' },
          { nameAr: 'رأس تنورة', nameEn: 'Ras Tanura' },
          { nameAr: 'بقيق', nameEn: 'Buqayq' },
          { nameAr: 'الخفجي', nameEn: 'Khafji' },
        ],
      },
      {
        nameAr: 'منطقة المدينة المنورة',
        nameEn: 'Madinah Region',
        cities: [
          { nameAr: 'المدينة المنورة', nameEn: 'Madinah' },
          { nameAr: 'ينبع', nameEn: 'Yanbu' },
          { nameAr: 'العلا', nameEn: 'Al Ula' },
          { nameAr: 'بدر', nameEn: 'Badr' },
          { nameAr: 'خيبر', nameEn: 'Khaybar' },
          { nameAr: 'المهد', nameEn: 'Mahd adh Dhahab' },
        ],
      },
      {
        nameAr: 'منطقة القصيم',
        nameEn: 'Qassim Region',
        cities: [
          { nameAr: 'بريدة', nameEn: 'Buraydah' },
          { nameAr: 'عنيزة', nameEn: 'Unayzah' },
          { nameAr: 'الرس', nameEn: 'Ar Rass' },
          { nameAr: 'البكيرية', nameEn: 'Al Bukayriyah' },
          { nameAr: 'المذنب', nameEn: 'Al Mithnab' },
          { nameAr: 'البدائع', nameEn: 'Al Badai' },
        ],
      },
      {
        nameAr: 'منطقة عسير',
        nameEn: 'Asir Region',
        cities: [
          { nameAr: 'أبها', nameEn: 'Abha' },
          { nameAr: 'خميس مشيط', nameEn: 'Khamis Mushait' },
          { nameAr: 'بيشة', nameEn: 'Bisha' },
          { nameAr: 'النماص', nameEn: 'An Namas' },
          { nameAr: 'محايل عسير', nameEn: 'Muhayil Asir' },
          { nameAr: 'ظهران الجنوب', nameEn: 'Dhahran Al Janub' },
        ],
      },
      {
        nameAr: 'منطقة تبوك',
        nameEn: 'Tabuk Region',
        cities: [
          { nameAr: 'تبوك', nameEn: 'Tabuk' },
          { nameAr: 'الوجه', nameEn: 'Al Wajh' },
          { nameAr: 'ضباء', nameEn: 'Duba' },
          { nameAr: 'تيماء', nameEn: 'Tayma' },
          { nameAr: 'أملج', nameEn: 'Umluj' },
          { nameAr: 'حقل', nameEn: 'Haql' },
        ],
      },
      {
        nameAr: 'منطقة حائل',
        nameEn: 'Hail Region',
        cities: [
          { nameAr: 'حائل', nameEn: 'Hail' },
          { nameAr: 'بقعاء', nameEn: 'Baqaa' },
          { nameAr: 'الغزالة', nameEn: 'Al Ghazalah' },
          { nameAr: 'الشنان', nameEn: 'Ash Shinan' },
        ],
      },
      {
        nameAr: 'منطقة الحدود الشمالية',
        nameEn: 'Northern Borders',
        cities: [
          { nameAr: 'عرعر', nameEn: 'Arar' },
          { nameAr: 'رفحاء', nameEn: 'Rafha' },
          { nameAr: 'طريف', nameEn: 'Turaif' },
        ],
      },
      {
        nameAr: 'منطقة جازان',
        nameEn: 'Jazan Region',
        cities: [
          { nameAr: 'جازان', nameEn: 'Jazan' },
          { nameAr: 'صبيا', nameEn: 'Sabya' },
          { nameAr: 'أبو عريش', nameEn: 'Abu Arish' },
          { nameAr: 'صامطة', nameEn: 'Samtah' },
        ],
      },
      {
        nameAr: 'منطقة نجران',
        nameEn: 'Najran Region',
        cities: [
          { nameAr: 'نجران', nameEn: 'Najran' },
          { nameAr: 'شرورة', nameEn: 'Sharurah' },
          { nameAr: 'حبونا', nameEn: 'Habuna' },
        ],
      },
      {
        nameAr: 'منطقة الباحة',
        nameEn: 'Al Bahah Region',
        cities: [
          { nameAr: 'الباحة', nameEn: 'Al Bahah' },
          { nameAr: 'بلجرشي', nameEn: 'Baljurashi' },
          { nameAr: 'المندق', nameEn: 'Al Mandaq' },
        ],
      },
      {
        nameAr: 'منطقة الجوف',
        nameEn: 'Al Jawf Region',
        cities: [
          { nameAr: 'سكاكا', nameEn: 'Sakaka' },
          { nameAr: 'دومة الجندل', nameEn: 'Dumat Al-Jandal' },
          { nameAr: 'القريات', nameEn: 'Qurayyat' },
        ],
      },
    ],
  },
  {
    code: 'AE',
    nameAr: 'الإمارات العربية المتحدة',
    nameEn: 'United Arab Emirates',
    regions: [
      { nameAr: 'أبوظبي', nameEn: 'Abu Dhabi', cities: [{ nameAr: 'أبوظبي', nameEn: 'Abu Dhabi' }, { nameAr: 'العين', nameEn: 'Al Ain' }] },
      { nameAr: 'دبي', nameEn: 'Dubai', cities: [{ nameAr: 'دبي', nameEn: 'Dubai' }] },
      { nameAr: 'الشارقة', nameEn: 'Sharjah', cities: [{ nameAr: 'الشارقة', nameEn: 'Sharjah' }] },
      { nameAr: 'عجمان', nameEn: 'Ajman', cities: [{ nameAr: 'عجمان', nameEn: 'Ajman' }] },
      { nameAr: 'رأس الخيمة', nameEn: 'Ras Al Khaimah', cities: [{ nameAr: 'رأس الخيمة', nameEn: 'Ras Al Khaimah' }] },
      { nameAr: 'الفجيرة', nameEn: 'Fujairah', cities: [{ nameAr: 'الفجيرة', nameEn: 'Fujairah' }] },
      { nameAr: 'أم القيوين', nameEn: 'Umm Al Quwain', cities: [{ nameAr: 'أم القيوين', nameEn: 'Umm Al Quwain' }] },
    ],
  },
  {
    code: 'BH',
    nameAr: 'البحرين',
    nameEn: 'Bahrain',
    regions: [
      { nameAr: 'العاصمة', nameEn: 'Capital', cities: [{ nameAr: 'المنامة', nameEn: 'Manama' }] },
      { nameAr: 'المحرق', nameEn: 'Muharraq', cities: [{ nameAr: 'المحرق', nameEn: 'Muharraq' }] },
      { nameAr: 'الجنوبية', nameEn: 'Southern', cities: [{ nameAr: 'عيسى', nameEn: 'Isa Town' }, { nameAr: 'الرفاع', nameEn: 'Riffa' }] },
      { nameAr: 'الشمالية', nameEn: 'Northern', cities: [{ nameAr: 'مدينة حمد', nameEn: 'Hamad Town' }] },
    ],
  },
  {
    code: 'KW',
    nameAr: 'الكويت',
    nameEn: 'Kuwait',
    regions: [
      { nameAr: 'العاصمة', nameEn: 'Capital', cities: [{ nameAr: 'الكويت', nameEn: 'Kuwait City' }] },
      { nameAr: 'حولي', nameEn: 'Hawalli', cities: [{ nameAr: 'حولي', nameEn: 'Hawalli' }, { nameAr: 'السالمية', nameEn: 'Salmiya' }] },
      { nameAr: 'الفروانية', nameEn: 'Farwaniya', cities: [{ nameAr: 'الفروانية', nameEn: 'Farwaniya' }] },
      { nameAr: 'الأحمدي', nameEn: 'Ahmadi', cities: [{ nameAr: 'الأحمدي', nameEn: 'Ahmadi' }] },
      { nameAr: 'الجهراء', nameEn: 'Jahra', cities: [{ nameAr: 'الجهراء', nameEn: 'Jahra' }] },
    ],
  },
  {
    code: 'OM',
    nameAr: 'عُمان',
    nameEn: 'Oman',
    regions: [
      { nameAr: 'مسقط', nameEn: 'Muscat', cities: [{ nameAr: 'مسقط', nameEn: 'Muscat' }] },
      { nameAr: 'ظفار', nameEn: 'Dhofar', cities: [{ nameAr: 'صلالة', nameEn: 'Salalah' }] },
      { nameAr: 'شمال الباطنة', nameEn: 'Al Batinah North', cities: [{ nameAr: 'صحار', nameEn: 'Sohar' }] },
    ],
  },
  {
    code: 'QA',
    nameAr: 'قطر',
    nameEn: 'Qatar',
    regions: [
      { nameAr: 'الدوحة', nameEn: 'Doha', cities: [{ nameAr: 'الدوحة', nameEn: 'Doha' }] },
      { nameAr: 'الريان', nameEn: 'Al Rayyan', cities: [{ nameAr: 'الريان', nameEn: 'Al Rayyan' }] },
      { nameAr: 'الوكرة', nameEn: 'Al Wakrah', cities: [{ nameAr: 'الوكرة', nameEn: 'Al Wakrah' }] },
    ],
  },
  {
    code: 'EG',
    nameAr: 'مصر',
    nameEn: 'Egypt',
    regions: [
      { nameAr: 'القاهرة', nameEn: 'Cairo', cities: [{ nameAr: 'القاهرة', nameEn: 'Cairo' }] },
      { nameAr: 'الإسكندرية', nameEn: 'Alexandria', cities: [{ nameAr: 'الإسكندرية', nameEn: 'Alexandria' }] },
      { nameAr: 'الجيزة', nameEn: 'Giza', cities: [{ nameAr: 'الجيزة', nameEn: 'Giza' }, { nameAr: '6 أكتوبر', nameEn: '6th of October' }] },
    ],
  },
];

// Helper to find regions for a country
export function getRegions(countryCode: string): Region[] {
  return countries.find(c => c.code === countryCode)?.regions ?? [];
}

// Helper to find cities for a region
export function getCities(countryCode: string, regionName: string): City[] {
  return getRegions(countryCode).find(r => r.nameAr === regionName)?.cities ?? [];
}
