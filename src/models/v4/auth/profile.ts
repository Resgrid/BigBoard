export interface ProfileModel {
  sub: string;
  jti: string;
  useage: string;
  at_hash: string;
  nbf: number;
  exp: number;
  iat: number;
  iss: string;
  name: string;
  oi_au_id: string;
  oi_tkn_id: string;

  //actor: string; // department name
  //givenname: string;  // full name
  //primarysid: string; // user id
  //name: string; // username
  //primarygroupsid: string; // department id
  //unique_name: string;
  //email_confirmed: boolean;
  //emailaddress: string; // email address
  //role: string[];
}
