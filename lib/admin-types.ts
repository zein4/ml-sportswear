export type StaffPayment={id:string;stage:string;payment_option:string;method:string;expected_amount:number;customer_reference:string;status:string;created_at:string;proof_url?:string|null};
export type StaffOrder={
  id:string;code:string;created_at:string;garment:string;color:string;accent_color:string;print_color:string;
  player_name:string;player_number:string;team_name:string;sizes:Record<string,number>;quantity:number;roster:string;notes:string;
  contact_name:string;email:string;phone:string;organization:string;estimated_total:number;status:string;
  front_design_url?:string|null;back_design_url?:string|null;artwork_layout?:Record<string,{x:number;y:number;scale:number}>;
  has_tracking_link:boolean;quoted_total:number|null;deposit_percent:number;quote_notes:string;gcash_instructions:string;bank_instructions:string;
  quote_issued_at:string|null;customer_approved_at:string|null;production_status:string;delivery_status:string;delivery_reference:string;
  payments:StaffPayment[];
};
