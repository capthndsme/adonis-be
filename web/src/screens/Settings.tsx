import { useEffect, useState } from "react";
import { Button, Card, Container } from "react-bootstrap";
import { getAllSettings, type Setting, settingStrings, updateSetting } from "../api/settingsApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import UserEditor from "../components/UserEditor";
import Switch from "react-switch";
import { Audit } from "./Audit";
import { DelayRender } from "../components/DelayRender";
export const Settings = (): JSX.Element => {
   const [data, setData] = useState<Setting | null>();
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [newPresetName, setNewPresetName] = useState("");

   const [hour, setHour] = useState(() => {
      const std = new Date()
      return [std.getHours(), std.getMinutes()]
   })

   const navigate = useNavigate();
   async function reloader() {
      const { data } = await getAllSettings();

      setData(data);
      setLoading(false);
   }
   useEffect(() => {
      reloader();
   }, []);

   const saveSettings = async () => {
      setSaving(true);

      try {
         await updateSetting(data!);
      } catch (e) {
         console.warn(e);
         toast("Error saving settings: " + (e instanceof Error ? e.message : "Unknown error"), { type: "error" }); 
      } finally {
         await new Promise((resolve) => setTimeout(resolve, 560));
         setSaving(false);
         toast("Settings saved successfully", { type: "success" });

         console.log("DATA PATCH", data)
      }





   }

   if (loading || data === null || !data)
      return (
         <div>
            <center>Loading settings...</center>
         </div>
      );

   return (
      <>
         {saving && <div
            style={{
               position: "fixed",
               top: 0,
               left: 0,
               width: "100%",
               height: "100%",
               backgroundColor: "rgba(255,255,255,0.2)",
               zIndex: 1000,
               color: 'black',
               display: "flex",
               justifyContent: "center",
               alignItems: "center"

            }}
         >
            Saving...
         </div>}
         <Container
            style={{
               transformOrigin: "0% 0%",
               ...saving ? {
                  transform: "translateX(20px) scale(0.95) rotateZ(1deg)",
                  userSelect: 'none',
                  opacity: 0.8,
                  filter: 'blur(8px)'
               } : {}
            }}
         >
            <h2 className="mt-4">Settings</h2>
            <DelayRender delay={50}>
               <Card className="mt-4">
                  <Card.Header>Automations</Card.Header>
                  <Card.Body>
                     <Container>
                        <h3>Soil Moisture Threshold</h3>
                        <hr />
                        <div className="h-baseline">
                           <div className="me-2">Enable threshold</div>
                           <Switch checked={data.thresholdEnabled ?? false}
                              onChange={(val) => {
                                 setData(prev => {
                                    return {
                                       ...prev,
                                       thresholds: {
                                          ...prev?.thresholds ?? {},
                                          soilMoisture: {
                                             low: prev?.thresholds?.soilMoisture?.low ?? 20,
                                             high: prev?.thresholds?.soilMoisture?.high ?? 80
                                          },
                                          tankLevel: {
                                             low: prev?.thresholds?.tankLevel?.low ?? 20,
                                          }
                                       },
                                       intervals: {
                                          ...prev?.intervals
                                       },
                                       thresholdEnabled: val
                                    } as const as Setting
                                 })
                              }}
                           />
                        </div>
                        <div
                           style={{
                              ...data.thresholdEnabled ? {
                                 height: 60,
                                 transform: 'scale(1)',
                                 filter: 'blur(0px)',
                                 transformOrigin: "0% 0%"
                              } : {
                                 height: 0,
                                 transform: 'scale(0)',
                                 overflow: 'hidden',
                                 filter: 'blur(8px)',
                                 transformOrigin: "0% 0%"
                              }
                           }}
                        >
                           <div className="h-baseline my-2"
                           >
                              <div>Watering start threshold</div>
                              <input type="range" value={data.thresholds?.soilMoisture?.low ?? 20} max={100}
                                 onChange={e => {
                                    const val = Number(e.target.value)
                                    setData(prev => {
                                       return {
                                          ...prev,
                                          thresholds: {
                                             ...prev?.thresholds ?? {},
                                             soilMoisture: {
                                                low: val,
                                                high: prev?.thresholds?.soilMoisture?.high ?? 80
                                             },
                                             tankLevel: {
                                                low: prev?.thresholds?.tankLevel?.low ?? 20,
                                             }
                                          },
                                          intervals: {
                                             ...prev?.intervals
                                          },
                                          thresholdEnabled: prev?.thresholdEnabled ?? false
                                       } as const as Setting
                                    })
                                 }}
                              />
                              <div>{data.thresholds?.soilMoisture?.low ?? 20}</div>
                           </div>

                           <div className="h-baseline my-2">
                              <div>Watering stop threshold</div>
                              <input type="range" value={data.thresholds?.soilMoisture?.high ?? 20} max={100}
                                 onChange={e => {
                                    const val = Number(e.target.value)
                                    setData(prev => {
                                       return {
                                          ...prev,
                                          thresholds: {
                                             ...prev?.thresholds ?? {},
                                             soilMoisture: {
                                                low: prev?.thresholds?.soilMoisture?.low ?? 20,
                                                high: val
                                             },
                                             tankLevel: {
                                                low: prev?.thresholds?.tankLevel?.low ?? 20,
                                             }
                                          },
                                          intervals: {
                                             ...prev?.intervals
                                          },
                                          thresholdEnabled: prev?.thresholdEnabled ?? false
                                       } as const as Setting
                                    })
                                 }}

                              />
                              <div>{data.thresholds?.soilMoisture?.high ?? 20}</div>
                           </div></div>

                        <h3 className="mt-4">Watering Timer</h3>
                        <hr />
                        <div className="h-baseline">
                           <div className="me-2">Enable water timer</div>
                           <Switch checked={data.timerBaseEnabled ?? false}
                              onChange={(val) => {
                                 setData(prev => {
                                    return {
                                       ...prev,
                                       thresholds: {
                                          ...prev?.thresholds ?? {},
                                          soilMoisture: {
                                             low: prev?.thresholds?.soilMoisture?.low ?? 20,
                                             high: prev?.thresholds?.soilMoisture?.high ?? 80
                                          },
                                          tankLevel: {
                                             low: prev?.thresholds?.tankLevel?.low ?? 20,
                                          }
                                       },
                                       intervals: {
                                          ...prev?.intervals
                                       },
                                       timerBaseEnabled: val
                                    } as const as Setting
                                 })
                              }}
                           />
                        </div>
                        <div
                           style={{
                              ...data.timerBaseEnabled ? {
                                 height: "100%",
                                 transform: 'scale(1)',
                                 filter: 'blur(0px)',
                                 transformOrigin: "0% 0%"
                              } : {
                                 height: 0,
                                 transform: 'scale(0)',
                                 overflow: 'hidden',
                                 filter: 'blur(8px)',
                                 transformOrigin: "0% 0%"
                              }
                           }}
                        >
                           <div className="h-baseline my-2">
                              Hour: <input type="number" value={hour[0]} className="w-sm form-control " min={0} max={23}

                                 onChange={e => {
                                    const v = Number(e.target.value)
                                    setHour(h => [v, h[1]])
                                 }}></input>
                              Minute: <input type="number" value={hour[1]} className="w-sm form-control " min={0} max={59}

                                 onChange={e => {
                                    const v = Number(e.target.value)
                                    setHour(h => [h[0], v])
                                 }}

                              ></input>
                              <Button onClick={() => {
                                 setData(prev => {
                                    // block if hhmm combo exist

                                    if (prev?.waterTimes?.find(wt => wt.hours === hour[0] && wt.minutes === hour[1])) {
                                       toast.warn(`Time ${hour[0]}:${hour[1]} already exists`)
                                       return prev;
                                    }

                                    // validate h 0-23, m 0-59
                                    if (hour[0] < 0 || hour[0] > 23 || hour[1] < 0 || hour[1] > 59) {
                                       toast.warn("Invalid time")
                                       return prev;
                                    }


                                    const newWaterTimes = [...(prev?.waterTimes ?? []), { hours: hour[0], minutes: hour[1] }]
                                    return {
                                       ...prev,
                                       waterTimes: newWaterTimes,
                                       thresholds: {
                                          ...prev?.thresholds ?? {},
                                          soilMoisture: {
                                             low: prev?.thresholds?.soilMoisture?.low ?? 20,
                                             high: prev?.thresholds?.soilMoisture?.high ?? 80
                                          },
                                          tankLevel: {
                                             low: prev?.thresholds?.tankLevel?.low ?? 20,
                                          }
                                       },
                                       intervals: {
                                          ...prev?.intervals
                                       },
                                       timerBaseEnabled: prev?.timerBaseEnabled ?? false
                                    } as const as Setting
                                 })

                              }} variant="secondary">ADD</Button>
                           </div>
                           <div>
                              {
                                 data?.waterTimes?.map((waterTime, id) => (
                                    <DelayRender key={id} delay={id * 40}>
                                       <div className="h-baseline my-2 loader-animation">
                                          <div>Trigger: {`${waterTime.hours}:${waterTime.minutes}`}</div>
                                          <Button variant="danger"
                                             onClick={() => {
                                                setData(prev => {
                                                   const newWaterTimes = prev?.waterTimes?.filter(wt => wt.hours !== waterTime.hours || wt.minutes !== waterTime.minutes) ?? []
                                                   return {
                                                      ...prev,
                                                      waterTimes: newWaterTimes,
                                                      thresholds: {
                                                         ...prev?.thresholds ?? {},
                                                         soilMoisture: {
                                                            low: prev?.thresholds?.soilMoisture?.low ?? 20,
                                                            high: prev?.thresholds?.soilMoisture?.high ?? 80
                                                         },
                                                         tankLevel: {
                                                            low: prev?.thresholds?.tankLevel?.low ?? 20,
                                                         }
                                                      },
                                                      intervals: {
                                                         ...prev?.intervals
                                                      },
                                                      timerBaseEnabled: prev?.timerBaseEnabled ?? false
                                                   } as const as Setting
                                                })
                                             }}

                                          >Delete</Button>
                                       </div>
                                    </DelayRender>))
                              }
                           </div>
                        </div>
                        <Button disabled={saving} onClick={() => saveSettings()} variant="secondary">Apply to device</Button>
                        <h3 className="mt-4">Presets</h3><hr />
                        <div className="mt-2">Create a preset with the current settings</div>
                        <div className="h-baseline">
                           <input className="form-control w-auto" /> <Button disabled={saving} variant="secondary">Save preset</Button>
                        </div>
                        <div className="mt-2">Load a preset</div>

                     </Container>
                  </Card.Body>
               </Card>
            </DelayRender>

            <DelayRender delay={100}>
               <Card className="mt-4">
                  <Card.Header>Audit Log</Card.Header>
                  <Card.Body>
                     <Audit />
                  </Card.Body>
               </Card>
            </DelayRender>
            <DelayRender delay={150}>
               <UserEditor />
            </DelayRender>

         </Container></>

   );
};


