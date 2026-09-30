import { PlanTemplatesService } from "../src/modules/plan-templates/plan-templates.service";
const repo=(overrides:any={})=>({find:jest.fn(),findOneByOrFail:jest.fn(),create:jest.fn((x)=>x),save:jest.fn(async(x)=>x),...overrides}) as never;
const context={id:"user",roles:["ADVISOR"],capabilities:["plan_templates.manage"],organizationIds:["org"],membershipIds:[],username:"u",sessionId:"s",role:"ADVISOR"};
describe("PlanTemplatesService",()=>{
  it("rejects an empty title after authorization",async()=>{
    const auth={canAccessOrganization:jest.fn().mockReturnValue(true)} as never;
    const service=new PlanTemplatesService(repo(),repo(),repo(),repo(),auth);
    await expect(service.create(context,{organizationId:"org",title:"   "})).rejects.toMatchObject({response:{error:{code:"TEMPLATE_TITLE_REQUIRED"}}});
  });
  it("creates an organization-scoped draft",async()=>{
    const templates:any=repo(), organizations:any=repo({findOneByOrFail:jest.fn().mockResolvedValue({id:"org"})});
    const service=new PlanTemplatesService(templates,organizations,repo(),repo(),{canAccessOrganization:jest.fn().mockReturnValue(true)} as never);
    await expect(service.create(context,{organizationId:"org",title:" هفته مرور ",tags:["ریاضی"]})).resolves.toMatchObject({title:"هفته مرور",state:"DRAFT",version:1});
  });
});
