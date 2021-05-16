import React, {useEffect, useRef, useState} from 'react';
import {FA_HOST} from '../conf';
export function FAError(){
return <div>Couldn't connect to FastAPI server at "{FA_HOST}"". Make sure it is running!</div>
}