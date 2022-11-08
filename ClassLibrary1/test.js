function test(vars){
    return new Promise((resolve, reject) => {
        newDB.getProductData(vars.country, vars.productType).then((productData) => {
            vars.radius = productData.product.kilometer;
            sibUnsubscribe(vars.email, vars.language).then(() => {
            }).catch((error) => {
                nodemail.sendError(`sibUnsubscribe:\r\n${error}`);
            });
            getLanguage(vars.country, vars.language).then((lang) => {
                newDB.getLanguageContent(lang, ["links", "img", "posts"]).then((language) => {
                    imgBuilder.createAdImgV3(vars.catImg, vars.street, vars.city, vars.catName, language.img).then((adUrl) => {
                        vars.imgLink = adUrl;
                        let privateMssg;
                        if (vars.postMssg === '' || vars.postMssg === undefined || vars.postMssg === null) {
                            privateMssg = `${language.posts.missingMssg}`;
                        } else {
                            privateMssg = vars.postMssg + "\r\n\r\n";
                        }
                        vars.postMssg = `${privateMssg}${language.posts.missingMssgStart}${vars.catName}${language.posts.missingMssgEnd} https://${language.links.site}/${language.posts.tipLink}?id=${encodeURIComponent(encryption.encryptProspectNr(vars.id))}`;
                        let postPromises = [];
                        //create instagram post
                        postPromises.push(new Promise((resolve) => {
                            let returnVal = {
                                instaPostId: "",
                                instaPostLink: "",
                            }
                            fbPage.postToInsta(adUrl, vars.postMssg, vars.region, language).then((instaPostRes) => {
                                fbPage.publishInsta(instaPostRes.id, vars.region).then((instaPublishRes) => {
                                    fbPage.getInstaPostLink(instaPublishRes.id, vars.region).then((instaPostLink) => {
                                        returnVal = {
                                            instaPostId: instaPublishRes.id,
                                            instaPostLink: instaPostLink,
                                        }
                                        resolve(returnVal);
                                    }).catch((error) => {
                                        nodemail.sendError(`getInstaPostLink:\r\n${error}\r\n${JSON.stringify(vars)}`);
                                        resolve(returnVal);
                                    });
                                }).catch((error) => {
                                    nodemail.sendError(`publishInsta:\r\n${error}\r\n${JSON.stringify(vars)}`);
                                    resolve(returnVal);
                                });
                            }).catch((error) => {
                                nodemail.sendError(`postToInsta:\r\n${error}\r\n${JSON.stringify(vars)}`);
                                resolve(returnVal);
                            });
                        }));

                        //create campaign
                        postPromises.push(fbAds.createCamp(vars, vars.region, productData.product));
                        let creationPromises = [];
                        //create creatives and share the post
                        creationPromises.push(new Promise((resolve, reject) => {
                            Promise.all(postPromises).then((postRes) => {
                                vars.campaignId = postRes[1];
                                vars.instaPostId = postRes[0].instaPostId;
                                vars.instaPostLink = postRes[0].instaPostLink;
                                let promises = [];
                                //create adsets
                                promises.push(fbAds.createFbAdset(vars, vars.region));
                                if (vars.instaPostId !== "") {
                                    promises.push(fbAds.createIgAdset(vars, vars.region));
                                }
                                Promise.all(promises).then((promiseResults) => {
                                    vars.fbAdsetId = promiseResults[0];
                                    if (promiseResults[1] !== undefined) {
                                        vars.instaAdsetId = promiseResults[1];
                                    } else {
                                        vars.instaAdsetId = "";
                                    }
                                    fbAds.createNewCreatives(vars, vars.region, language).then((response) => {
                                        vars.fbCreativeId = response.fbCreativeId;
                                        vars.instaCreativeId = response.instaCreativeId;
                                        //add delay to ensure fb is done creating the creatives
                                        setTimeout(() => {
                                            fbAds.getObjectSpecId(vars, vars.region).then((postId) => {
                                                vars.fbPostId = postId;
                                                fbAds.createAds(vars, vars.region).then((result) => {
                                                    setTimeout(() => {
                                                        fbAds.getShareAbleLink(result.fbAdId).then((shareLink) => {
                                                            vars.shareLink = shareLink;
                                                            vars.fbAdId = result.fbAdId
                                                            vars.instaAdId = result.instaAdId
                                                            fbPage.sharePost(vars.fbPostId, vars.region).then((pagePostId) => {
                                                                vars.fbPagePostId = pagePostId;
                                                                fbAds.optimizeRadius(vars.targetReach, vars.fbAdsetId, 0, vars.instaAdsetId, productData.product, vars.lat, vars.lng, vars.region).then(() => {
                                                                    nodemail.sendError("optimizeradius succeeded", ":)")
                                                                }).catch((error) => {
                                                                    nodemail.sendError("optimizeradius failed", error)
                                                                })
                                                                resolve();
                                                            }).catch((error) => {
                                                                reject(`sharePost:\r\n${error}`);
                                                            });
                                                        }).catch((error) => {
                                                            reject(`getShareAbleLink:\r\n${error}`);
                                                        });
                                                    }, 60000);
                                                }).catch((error) => {
                                                    reject(`createAds:\r\n${error}`);
                                                });
                                            }).catch((error) => {
                                                reject(`getObjectSpecId:\r\n${error}`);
                                            });
                                        }, 60000);
                                    }).catch((error) => {
                                        reject(`createNewCreatives:\r\n${error}`);
                                    });
                                }).catch((error) => {
                                    reject(`createAdsets:\r\n${error}`);
                                });
                            }).catch((error) => {
                                reject(`createCampaign:\r\n${error}`);
                            });
                        }));

                        Promise.all(creationPromises).then(() => {
                            let dataObj = {
                                "contact": {
                                    "fieldValues": [
                                        {
                                            "field": "2",
                                            "value": vars.fbPostId
                                        },
                                        {
                                            "field": "13",
                                            "value": vars.instaPostId
                                        },
                                        {
                                            "field": "45",
                                            "value": vars.instaPostLink
                                        },
                                        {
                                            "field": "36",
                                            "value": vars.imgLink
                                        },
                                        {
                                            "field": "50",
                                            "value": vars.instaAdId
                                        },
                                        {
                                            "field": "51",
                                            "value": vars.fbAdId
                                        },
                                        {
                                            "field": "69",
                                            "value": vars.shareLink
                                        }
                                    ]
                                }
                            }
                            acAPI.acUpdate(vars.id, dataObj).then((acRes) => {
                                if (acRes === "success") {
                                    let log = {
                                        source: "FbA",
                                        id: vars.campaignId,
                                        message: `Campaign started for ${vars.catName} | Customer id: ${vars.id}`,
                                    }
                                    newDB.createGeneralLog(log).then(() => {
                                    }).catch((error) => {
                                        nodemail.sendError(`Error: start campaign`, `createGeneralLog:\r\n${error}`);
                                    });

                                    resolve();
                                    // let conditionArr = [{
                                    //     key: "customerId",
                                    //     value: vars.id,
                                    //     operator: "="
                                    // }]

                                    let customer = {
                                        acId: vars.id
                                    }
                                    let search = {
                                        lat: vars.lat,
                                        lng: vars.lng,
                                        picLink: vars.imgLink,
                                        acId: vars.id
                                    }
                                    try {
                                        acAPI.updateCustomerData(customer, vars.fbPostId)
                                        acAPI.updateCustomerData(customer, vars.fbPagePostId)
                                        acAPI.updateCustomerData(customer, vars.fbAdId)
                                        acAPI.addActiveSearch(search)
                                        acAPI.putAutomation(vars.id, 31)
                                    } catch (e) {
                                        nodemail.sendError("Error: start campaign (update customerdata / active search)", e + "\r\n" + JSON.stringify(vars))
                                    }

                                    let conditionArray = [{
                                        key: "customerId",
                                        value: vars.id,
                                        operator: "="
                                    }]
                                    newDB.getSearchesColumns(conditionArray, ["id", "catImg"]).then((searches) => {
                                        if (searches.length > 0) {
                                            searches.forEach((search) => {
                                                if (search.catImg === vars.catImg) {
                                                    let searchObj = {
                                                        id: search.id,
                                                        fbPostId: vars.fbPostId,
                                                        instaPostId: vars.instaPostId,
                                                        instaPostUrl: vars.instaPostLink,
                                                        postImg: vars.imgLink,
                                                        campaignId: vars.campaignId,
                                                    }
                                                    newDB.updateSearch(searchObj).then(() => {
                                                        let areaConditionArray = [
                                                            {
                                                                key: "searchId",
                                                                value: search.id,
                                                                operator: "="
                                                            }
                                                        ]
                                                        newDB.getAreasColumns(areaConditionArray, ["id"]).then((areas) => {
                                                            if (areas.length > 0) {
                                                                let areaId
                                                                areas.forEach((area) => {
                                                                    if (area.lat === vars.lat && area.lng === vars.lng) {
                                                                        areaId = area.id
                                                                    }
                                                                })
                                                                let updateArea = {
                                                                    id: areaId,
                                                                    fbAdId: vars.fbAdId,
                                                                    instaAdId: vars.instaAdId,
                                                                }
                                                                newDB.updateArea(updateArea).then(() => {
                                                                }).catch((error) => {
                                                                    nodemail.sendError(`Error: start campaign`, `UpdateArea:\r\n${error}`);
                                                                });
                                                            } else {
                                                                if (areas.lat === vars.lat && areas.lng === vars.lng) {
                                                                    let updateArea = {
                                                                        id: areas.id,
                                                                        fbAdId: vars.fbAdId,
                                                                        instaAdId: vars.instaAdId,
                                                                    }
                                                                    newDB.updateArea(updateArea).then(() => {
                                                                    }).catch((error) => {
                                                                        nodemail.sendError(`Error: start campaign`, `UpdateArea:\r\n${error}`);
                                                                    });
                                                                } else {
                                                                    nodemail.sendError(`Error: start campaign`, `Areas don't match\r\nVars: ${JSON.stringify(vars)}\r\nArea: ${JSON.stringify(areas)}`);
                                                                }
                                                            }
                                                        }).catch((error) => {
                                                            nodemail.sendError(`Error: start campaign`, `getAreasColumns\r\n${error}`);
                                                        });

                                                    }).catch((error) => {
                                                        nodemail.sendError("Error: update search (multiple searches)", error + "\r\n" + JSON.stringify(searchObj))
                                                    });
                                                }
                                            })
                                        } else {
                                            let searchObj = {
                                                id: searches.id,
                                                fbPostId: vars.fbPostId,
                                                instaPostId: vars.instaPostId,
                                                instaPostUrl: vars.instaPostLink,
                                                campaignId: vars.campaignId,
                                                postImg: vars.imgLink,
                                            }
                                            newDB.updateSearch(searchObj).then(() => {
                                                let areaConditionArray = [
                                                    {
                                                        key: "searchId",
                                                        value: searches.id,
                                                        operator: "="
                                                    }
                                                ]
                                                newDB.getAreasColumns(areaConditionArray, ["id"]).then((areas) => {
                                                    if (areas.length > 0) {
                                                        let areaId
                                                        areas.forEach((area) => {
                                                            if (area.lat === vars.lat && area.lng === vars.lng) {
                                                                areaId = area.id
                                                            }
                                                        })
                                                        let updateArea = {
                                                            id: areaId,
                                                            fbAdId: vars.fbAdId,
                                                            instaAdId: vars.instaAdId,
                                                        }
                                                        newDB.updateArea(updateArea).then(() => {
                                                        }).catch((error) => {
                                                            nodemail.sendError(`Error: start campaign`, `UpdateArea:\r\n${error}`);
                                                        });
                                                    } else {
                                                        if (areas.lat === vars.lat && areas.lng === vars.lng) {
                                                            let updateArea = {
                                                                id: areas.id,
                                                                fbAdId: vars.fbAdId,
                                                                instaAdId: vars.instaAdId,
                                                            }
                                                            newDB.updateArea(updateArea).then(() => {
                                                            }).catch((error) => {
                                                                nodemail.sendError(`Error: start campaign`, `UpdateArea:\r\n${error}`);
                                                            });
                                                        } else {
                                                            nodemail.sendError(`Error: start campaign`, `Areas don't match\r\nVars: ${JSON.stringify(vars)}\r\nArea: ${JSON.stringify(areas)}`);
                                                        }
                                                    }
                                                }).catch((error) => {
                                                    nodemail.sendError(`Error: start campaign`, `getAreasColumns\r\n${error}`);
                                                });
                                            }).catch((error) => {
                                                nodemail.sendError("Error: update search", error + "\r\n" + JSON.stringify(searchObj))
                                            });
                                        }
                                    }).catch((error) => {
                                        nodemail.sendError('Error: start campaign', `getSearchesColumns\r\n${error}`);
                                    });
                                }
                            }).catch((error) => {
                                reject(`Error: start campaign\r\n${error}`);
                            });
                        }).catch((error) => {
                            reject(`Error: creationPromise\r\n${error}`);
                        });
                    }).catch((error) => {
                        reject(`Error: createAdImg\r\n${error}`);
                    });
                }).catch((error) => {
                    reject(`Error: getLanguageContent\r\n${error}`);
                });
            }).catch((error) => {
                reject(`Error: getLanguage(country)\r\n${error}`);
            });
        }).catch((error) => {
            reject(`getProductData:\r\n${error}`);
        });
    });
}
