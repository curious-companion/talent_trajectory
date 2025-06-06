import { Fragment, useContext, useRef, useState } from 'react';
import { Header } from '../../components/header';
import {
    PredictStudent,
    RecommendSkills,
} from '../../apis/StudentAPI';
import {
    Alert,
    Button,
    CircularProgress,
    Container,
    FormControl,
    FormControlLabel,
    FormLabel,
    IconButton,
    InputLabel,
    OutlinedInput,
    Radio,
    RadioGroup,
    Select,
    Snackbar,
    TextField,
} from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import styles from './student.module.css';
import { AppContext } from '../../contexts/AppContext';
import { GiMedallist } from 'react-icons/gi';
import { TfiHandPointRight } from 'react-icons/tfi';
import { DownloadRecommendedSkills } from '../../apis/StudentAPI';
import CloseIcon from '@mui/icons-material/Close';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;

const INITIAL_STATE = {
    tier: '',
    cgpa: '',
    inter_gpa: '',
    ssc_gpa: '',
    internships: '',
    is_participate_hackathon: '',
    is_participated_extracurricular: '',
    no_of_programming_languages: '',
    no_of_projects: '',
    dsa: 0,
    mobile_dev: 0,
    web_dev: 0,
    'Machine Learning': 0,
    cloud: 0,
    CSE: 0,
    ECE: 0,
    IT: 0,
    MECH: 0,
};

export const Student = () => {
    const { isMobile } = useContext(AppContext);
    const [formDetails, setformDetails] = useState(INITIAL_STATE);

    const [selectedSkills, setselectedSkills] = useState([]);
    const [branch, setbranch] = useState('');
    const [predictedData, setPredictedData] = useState(null);
    const [recommendedSkills, setrecommendedSkills] = useState([]);
    const [predictLoading, setpredictLoading] = useState(false);
    const predictedComponentRef = useRef(null);
    const executeScroll = () => predictedComponentRef.current.scrollIntoView();

    const [openSnackBar, setopenSnackBar] = useState(false);

    const [snackBarOptions, setsnackBarOptions] = useState({
        msg: '',
        severity: '',
    });
    const handleOpenSnackBar = (msg, severity) => {
        setopenSnackBar(true);
        setsnackBarOptions({
            msg: msg,
            severity: severity,
        });
    };

    const handleCloseSnackBar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setopenSnackBar(false);
    };

    const action = (
        <Fragment>
            <Button
                color='secondary'
                size='small'
                onClick={handleCloseSnackBar}
            >
                UNDO
            </Button>
            <IconButton
                size='small'
                aria-label='close'
                color='inherit'
                onClick={handleCloseSnackBar}
            >
                <CloseIcon fontSize='small' />
            </IconButton>
        </Fragment>
    );
    const formstyles = {
        width: '100%',
        backgroundColor: '#e5eff0',
        borderRadius: '4px',

        fieldset: {
            borderColor: '#e5eff0',
        },
        '&:active fieldset': { borderColor: 'red' },
        '& label.Mui-focused': {
            color: '#b7c2c4',
        },
        '& .MuiInput-underline:after': {
            borderBottomColor: 'black',
        },
        '& .MuiOutlinedInput-root': {
            '& fieldset': {
                borderColor: '#e5eff0',
            },
            '&:hover fieldset': {
                borderColor: '#b7c2c4',
            },
            '&.Mui-focused fieldset': {
                borderColor: '#b7c2c4',
            },
        },
    };

    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 250,
            },
        },
    };

    const skills = [
        { name: 'DSA', key: 'dsa' },
        { name: 'Mobile app development', key: 'mobile_dev' },
        { name: 'Web development', key: 'web_dev' },
        { name: 'Machine Learning', key: 'Machine Learning' },
        { name: 'Cloud', key: 'cloud' },
    ];

    const handleSkillsChange = async (event) => {
        const {
            target: { value },
        } = event;
        setselectedSkills(typeof value === 'string' ? value.split(',') : value);
        setformDetails((prevState) => {
            const newState = {
                ...prevState,
                dsa: 0,
                mobile_dev: 0,
                web_dev: 0,
                'Machine Learning': 0,
                cloud: 0,
            };
            const assignSelectedSkills = {};
            value.forEach((skill) => (assignSelectedSkills[skill] = 1));

            return { ...newState, ...assignSelectedSkills };
        });
    };

    const handleChangeBranch = (e) => {
        e.preventDefault();
        setbranch((prevBranch) => {
            setformDetails((prev) => {
                return { ...prev, [prevBranch]: 0, [e.target.value]: 1 };
            });
            return e.target.value;
        });
    };

    const handlePredict = async (e) => {
        e.preventDefault();
        const data = {};
        for (const key in formDetails) {
            if (key) {
                if (
                    key == 'tier' ||
                    key === 'cgpa' ||
                    key === 'inter_gpa' ||
                    key === 'ssc_gpa' ||
                    key === 'internships' ||
                    key === 'is_participate_hackathon' ||
                    key === 'is_participated_extracurricular' ||
                    key === 'no_of_programming_languages' ||
                    key === 'no_of_projects'
                ) {
                    if (formDetails[key] === INITIAL_STATE[key]) {
                        handleOpenSnackBar(
                            'Please fill out all the fields',
                            'error'
                        );
                        return;
                    }
                    if (formDetails[key] < 0) {
                        handleOpenSnackBar(
                            'Make sure to fill the form with correct values',
                            'error'
                        );
                        return;
                    }
                } else if (!branch) {
                    handleOpenSnackBar('Branch is missing', 'error');
                    return;
                } else if (selectedSkills.length === 0) {
                    handleOpenSnackBar('skills are missing', 'error');
                    return;
                }
                data[key] = [Number(formDetails[key])];
            }
        }

        try {
            setpredictLoading(true);

            console.log("[INFO] Sending concurrent API requests: PredictStudent and RecommendSkills");
            console.log("[DEBUG] Data for PredictStudent:", data);
            console.log("[DEBUG] Selected Skills for RecommendSkills:", selectedSkills);

            const [res, recommendedSkills] = await Promise.all([
                PredictStudent(data),
                RecommendSkills({
                    skills: selectedSkills,
                })
            ]);

            console.log("[✅ SUCCESS] PredictStudent API response:", res);
            console.log("[✅ SUCCESS] RecommendSkills API response:", recommendedSkills);

            setPredictedData(res);
            setrecommendedSkills(recommendedSkills);
            setpredictLoading(false);
            setformDetails(INITIAL_STATE);
            setbranch('');
            setselectedSkills([]);
            executeScroll();
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Prediction Failed";
            handleOpenSnackBar(errorMessage, 'error');
        } finally{
            setpredictLoading(false);
        }
    };
    return (
        <div
            style={{
                fontFamily: 'var(--font-primary)',
                backgroundImage:
                    'linear-gradient(90deg, #21D4FD 0%, #cb8eeb 100%)',
            }}
        >
            <Header />

            <div
                style={{
                    minHeight: '90vh',
                    height: 'fit-content',
                    paddingBottom: '20px',
                }}
            >
                <Snackbar
                    open={openSnackBar}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackBar}
                    action={action}
                >
                    <Alert
                        onClose={handleCloseSnackBar}
                        severity={snackBarOptions.severity}
                    >
                        {snackBarOptions.msg}
                    </Alert>
                </Snackbar>
                {!isMobile && (
                    <div
                        style={{
                            width: '20rem',
                            opacity: 0.5,
                            position: 'absolute',
                        }}
                    >
                        <img
                            style={{ width: '100%' }}
                            src='/static/images/person-studying-online.png'
                        />
                    </div>
                )}
                <Container maxWidth='lg'>
                    <div className={styles.form}>
                        <div className={styles.grid}>
                            <div className={styles.grid_item}>
                                <FormControl fullWidth>
                                    <InputLabel id='demo-simple-select-helper-label'>
                                        College Tier
                                    </InputLabel>
                                    <Select
                                        labelId='demo-simple-select-label'
                                        id='demo-simple-select'
                                        value={formDetails.tier}
                                        label='College Tier'
                                        variant='outlined'
                                        onChange={(e) =>
                                            setformDetails((prev) => ({
                                                ...prev,
                                                tier: e.target.value,
                                            }))
                                        }
                                        sx={{
                                            ...formstyles,
                                        }}
                                    >
                                        <MenuItem value={'1'}>1</MenuItem>
                                        <MenuItem value={'2'}>2</MenuItem>
                                        <MenuItem value={'3'}>3</MenuItem>
                                    </Select>
                                </FormControl>
                            </div>
                            <div className={styles.grid_item}>
                                <TextField
                                    onChange={(e) =>
                                        setformDetails((prev) => ({
                                            ...prev,
                                            cgpa: e.target.value,
                                        }))
                                    }
                                    id='outlined-number'
                                    label='Degree CGPA'
                                    type='number'
                                    sx={{
                                        ...formstyles,
                                    }}
                                    value={formDetails.cgpa}
                                />
                            </div>
                            <div className={styles.grid_item}>
                                <FormControl fullWidth>
                                    <InputLabel id='demo-simple-select-label'>
                                        BRANCH
                                    </InputLabel>
                                    <Select
                                        labelId='demo-simple-select-label'
                                        id='demo-simple-select'
                                        value={branch}
                                        label='BRANCH'
                                        onChange={handleChangeBranch}
                                        sx={{
                                            ...formstyles,
                                        }}
                                    >
                                        <MenuItem value={'CSE'}>CSE</MenuItem>
                                        <MenuItem value={'ECE'}>ECE</MenuItem>
                                        <MenuItem value={'MECH'}>MECH</MenuItem>
                                    </Select>
                                </FormControl>
                            </div>

                            <div className={styles.grid_item}>
                                <TextField
                                    sx={{
                                        ...formstyles,
                                    }}
                                    onChange={(e) =>
                                        setformDetails((prev) => ({
                                            ...prev,
                                            inter_gpa: e.target.value,
                                        }))
                                    }
                                    id='outlined-number'
                                    label='Intermediate GPA'
                                    type='number'
                                    value={formDetails.inter_gpa}
                                />
                            </div>
                            <FormControl>
                                <div className={styles.grid_item}>
                                    <InputLabel id='demo-multiple-name-label'>
                                        Skills
                                    </InputLabel>
                                    <Select
                                        labelId='demo-multiple-name-label'
                                        id='demo-multiple-name'
                                        multiple
                                        value={selectedSkills}
                                        onChange={handleSkillsChange}
                                        input={<OutlinedInput label='Name' />}
                                        MenuProps={MenuProps}
                                        sx={{
                                            ...formstyles,
                                        }}
                                    >
                                        {skills.map((skill, idx) => (
                                            <MenuItem
                                                key={idx}
                                                value={skill.key}
                                            >
                                                {skill.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </div>
                            </FormControl>
                            <div className={styles.grid_item}>
                                <TextField
                                    sx={{
                                        ...formstyles,
                                    }}
                                    onChange={(e) =>
                                        setformDetails((prev) => ({
                                            ...prev,
                                            ssc_gpa: e.target.value,
                                        }))
                                    }
                                    id='outlined-number'
                                    label='SSC GPA'
                                    type='number'
                                    value={formDetails.ssc_gpa}
                                />
                            </div>
                            <div className={styles.grid_item}>
                                <TextField
                                    sx={{
                                        ...formstyles,
                                    }}
                                    onChange={(e) =>
                                        setformDetails((prev) => ({
                                            ...prev,
                                            internships: e.target.value,
                                        }))
                                    }
                                    id='outlined-number'
                                    label='Number Of Internships'
                                    type='number'
                                    value={formDetails.internships}
                                />
                            </div>
                            <div className={styles.grid_item}>
                                <FormLabel id='demo-controlled-radio-buttons-group'>
                                    Participated In Extra Curricular Activities
                                </FormLabel>
                                <RadioGroup
                                    row
                                    aria-labelledby='demo-row-radio-buttons-group-label'
                                    name='row-radio-buttons-group'
                                    value={
                                        formDetails.is_participated_extracurricular
                                    }
                                    onChange={(e) =>
                                        setformDetails((prev) => ({
                                            ...prev,
                                            is_participated_extracurricular:
                                                parseInt(e.target.value),
                                        }))
                                    }
                                >
                                    <FormControlLabel
                                        value={1}
                                        control={
                                            <Radio
                                                sx={{
                                                    '&, &.Mui-checked': {
                                                        color: '#b7c2c4',
                                                    },
                                                }}
                                            />
                                        }
                                        label='YES'
                                    />
                                    <FormControlLabel
                                        value={0}
                                        control={
                                            <Radio
                                                sx={{
                                                    '&, &.Mui-checked': {
                                                        color: '#b7c2c4',
                                                    },
                                                }}
                                            />
                                        }
                                        label='NO'
                                    />
                                </RadioGroup>
                            </div>
                            <div className={styles.grid_item}>
                                <TextField
                                    sx={{
                                        ...formstyles,
                                    }}
                                    onChange={(e) =>
                                        setformDetails((prev) => ({
                                            ...prev,
                                            no_of_projects: e.target.value,
                                        }))
                                    }
                                    id='outlined-number'
                                    label='Number Of Projects'
                                    type='number'
                                />
                            </div>

                            <div className={styles.grid_item}>
                                <FormLabel id='demo-controlled-radio-buttons-group'>
                                    Participated In Hackathons
                                </FormLabel>
                                <RadioGroup
                                    row
                                    aria-labelledby='demo-controlled-radio-buttons-group'
                                    name='controlled-radio-buttons-group'
                                    value={formDetails.is_participate_hackathon}
                                    onChange={(e) =>
                                        setformDetails((prev) => ({
                                            ...prev,
                                            is_participate_hackathon: parseInt(
                                                e.target.value
                                            ),
                                        }))
                                    }
                                >
                                    <FormControlLabel
                                        value={1}
                                        control={
                                            <Radio
                                                sx={{
                                                    '&, &.Mui-checked': {
                                                        color: '#b7c2c4',
                                                    },
                                                }}
                                            />
                                        }
                                        label='YES'
                                    />
                                    <FormControlLabel
                                        value={0}
                                        control={
                                            <Radio
                                                sx={{
                                                    '&, &.Mui-checked': {
                                                        color: '#b7c2c4',
                                                    },
                                                }}
                                            />
                                        }
                                        label='NO'
                                    />
                                </RadioGroup>
                            </div>

                            <div className={styles.grid_item}>
                                <TextField
                                    onChange={(e) =>
                                        setformDetails((prev) => ({
                                            ...prev,
                                            no_of_programming_languages:
                                                e.target.value,
                                        }))
                                    }
                                    id='outlined-number'
                                    label='Number Of Programming Languages'
                                    type='number'
                                    value={
                                        formDetails.no_of_programming_languages
                                    }
                                    sx={{
                                        ...formstyles,
                                    }}
                                />
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                margin: '20px',
                            }}
                        >
                            <button
                                onClick={handlePredict}
                                style={{
                                    fontSize: '18px',
                                    backgroundColor: '#06cca2',
                                    color: 'white',
                                    border: '1px solid #06cca2',
                                    padding: '8px 12px',
                                    width: '12rem',
                                    boxShadow:
                                        'rgba(0, 0, 0, 0.24) 0px 3px 8px',
                                    fontFamily: 'var(--font-secondary)',
                                }}
                            >
                                {predictLoading ? (
                                    <CircularProgress
                                        size='18px'
                                        sx={{ color: 'white' }}
                                        color='secondary'
                                    />
                                ) : (
                                    ''
                                )}{' '}
                                PREDICT
                            </button>
                        </div>
                    </div>
                    <div ref={predictedComponentRef}>
                        {predictedData && (
                            <div className={styles.predicted_screen}>
                                <h1
                                    style={{
                                        fontSize: '40px',
                                        textAlign: 'center',
                                    }}
                                >
                                    Here&apos;s your Prediction
                                </h1>
                                <div>
                                    <h2 style={{ fontWeight: 200 }}>
                                        <GiMedallist /> Chances Of Getting
                                        Placed:{' '}
                                        <span style={{ color: '#9d44c0' }}>
                                            {
                                                predictedData.predictions.placement_probability
                                            }
                                            %
                                        </span>
                                    </h2>
                                    <h1>
                                        <TfiHandPointRight /> Predicted Salary:{' '}
                                        <span style={{ color: '#9d44c0' }}>
                                            {predictedData.predictions.salary_prediction}LPA
                                        </span>
                                    </h1>
                                    <div>
                                        <p
                                            style={{
                                                fontSize: '20px',
                                                marginTop: '1rem',
                                            }}
                                        >
                                            <TfiHandPointRight /> Recommended
                                            Skills To Increase Your Chances Of
                                            Getting Placed: 
                                        <button
                                            onClick={() => DownloadRecommendedSkills({ skills: selectedSkills })}
                                            style={{
                                            marginLeft: '1rem',
                                            backgroundColor: '#9d44c0',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            }}
                                        > 
                                            Download
                                        </button>
                                        </p>

                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                columnGap: '10px',
                                                rowGap: '10px',
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            {recommendedSkills &&
                                                recommendedSkills.map(
                                                    (skill, idx) => {
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className={
                                                                    styles.recommendedSkills
                                                                }
                                                                style={{
                                                                    padding:
                                                                        '10px 20px',
                                                                    fontSize:
                                                                        '20px',
                                                                }}
                                                            >
                                                                {skill}
                                                            </div>
                                                        );
                                                    }
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Container>
            </div>
        </div>
    );
};