import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const countryCodes = [
  { code: '+258', country: 'MZ', name: 'Moçambique' },
  { code: '+27', country: 'ZA', name: 'África do Sul' },
  { code: '+351', country: 'PT', name: 'Portugal' },
  { code: '+55', country: 'BR', name: 'Brasil' },
  { code: '+1', country: 'US', name: 'EUA' },
];

export const PhoneInput = ({ value, onChange, placeholder, className }: PhoneInputProps) => {
  // Extract country code and number from value
  const getCountryCodeAndNumber = (phoneValue: string) => {
    if (!phoneValue) return { countryCode: '+258', number: '' };
    
    const matchingCode = countryCodes.find(cc => phoneValue.startsWith(cc.code));
    if (matchingCode) {
      return {
        countryCode: matchingCode.code,
        number: phoneValue.slice(matchingCode.code.length).trim()
      };
    }
    
    return { countryCode: '+258', number: phoneValue };
  };

  const { countryCode, number } = getCountryCodeAndNumber(value);

  const handleCountryCodeChange = (newCode: string) => {
    onChange(`${newCode} ${number}`);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/[^\d\s]/g, '');
    onChange(`${countryCode} ${newNumber}`);
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Select value={countryCode} onValueChange={handleCountryCodeChange}>
        <SelectTrigger className="w-[140px] h-9 sm:h-10 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((cc) => (
            <SelectItem key={cc.code} value={cc.code}>
              {cc.code} {cc.country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder || "84 000 0000"}
        className="h-9 sm:h-10 text-sm flex-1"
      />
    </div>
  );
};
