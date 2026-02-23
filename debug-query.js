const URL = "https://mixrgiygwtmygymempht.supabase.co/rest/v1/";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1peHJnaXlnd3RteWd5bWVtcGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjAxNDIsImV4cCI6MjA4NDUzNjE0Mn0.gm4pNCsoiRxKpNrdFGbOxMmgYF5h6hgM8zXG905mpDQ";

async function query() {
  const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };
  
  // get latest samples
  const sRes = await fetch(`${URL}samples?select=id,sample_id,project_id&order=created_at.desc&limit=5`, { headers });
  const samples = await sRes.json();
  console.log("Latest Samples:");
  for (const s of samples) {
    console.log(s.sample_id, "project=", s.project_id);
  }
  
  if (samples.length > 0) {
    const ids = samples.map(s => s.id).join(',');
    // get results
    const rRes = await fetch(`${URL}results?select=*,parameter_config:parameter_configs(*,parameter:parameters(*))&sample_id=in.(${ids})`, { headers });
    const results = await rRes.json();
    console.log("Total Results items for these 5 samples:", results.length);
    if(results.length > 0) {
      console.log("Sample Result example mapping:");
      console.log("status:", results[0].status);
      console.log("lab_section:", results[0].parameter_config.parameter.lab_section);
      console.log("department_id:", results[0].parameter_config.parameter.department_id);
      console.log("analyte_group:", results[0].parameter_config.parameter.analyte_group);
    }
  }
}
query();
